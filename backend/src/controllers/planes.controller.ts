import { Request, Response } from 'express';
import { db } from '../config/firebase';
import admin from 'firebase-admin';
import { PlanPayload, calcularMacrosPlan } from '../plan-utils';

export const obtenerPlanesAsignados = async (req: Request, res: Response) => {
    try {
        const uid = req.user?.uid;
        console.log(`[GET] /api/planes/asignados - Buscando planes para: ${uid}`);

        if (!uid) return res.status(403).send({ message: 'Usuario no válido.' });

        const snapshot = await db.collection('usuarios').doc(uid).collection('planes').get();

        if (snapshot.empty) {
            console.log('No tiene planes asignados.');
            return res.status(200).send([]);
        }

        const list = snapshot.docs.map(doc => {
            const data = doc.data();
            // Aseguramos que la fecha sea un número (timestamp)
            let fecha = data.fecha_asignacion;
            if (fecha && typeof fecha.toMillis === 'function') fecha = fecha.toMillis();
            else if (!fecha) fecha = Date.now();

            return {
                id: doc.id,
                nombre: data.nombre,
                descripcion: data.descripcion,
                versiones: data.versiones,
                fecha_asignacion: fecha
            };
        });

        console.log(`Se devolvieron ${list.length} planes.`);
        res.status(200).send(list);

    } catch (error) {
        console.error('Error al obtener planes asignados:', error);
        res.status(500).send({ message: 'Error interno.' });
    }
};

export const crearPlan = async (req: Request, res: Response) => {
    try {
        const nutriUid = req.user?.uid;
        console.log(`[POST] /api/planes - Nutricionista ${nutriUid} creando plan...`);

        if (!nutriUid) return res.status(403).send({ message: 'No autorizado.' });

        const { pacienteId, descripcionPlan, objetivo, ...planData } =
            req.body as (PlanPayload & { pacienteId: string, descripcionPlan?: string, objetivo?: string });

        if (!pacienteId) {
            console.log('Error: Falta pacienteId');
            return res.status(400).send({ message: "Falta pacienteId" });
        }

        // Usamos el utils para calcular
        const { comidasParaGuardar, totalesDiarios } = await calcularMacrosPlan(db, planData.comidas);

        if (comidasParaGuardar.length === 0) {
            console.log('Error: El plan no tiene alimentos válidos.');
            return res.status(400).send({ message: 'El plan debe tener alimentos válidos.' });
        }

        const versionId = planData.tipo.toLowerCase().replace('ó', 'o');
        const planParaGuardar = {
            nombre: planData.nombre.trim(),
            descripcion: descripcionPlan || `Plan creado por Nutricionista`,
            fecha_asignacion: admin.firestore.FieldValue.serverTimestamp(),
            versiones: {
                [versionId]: {
                    tipo: planData.tipo,
                    calorias: totalesDiarios.kcal,
                    objetivo: objetivo || 'No especificado',
                    comidas: comidasParaGuardar,
                    totales_diarios: totalesDiarios
                }
            }
        };

        const ref = await db.collection('usuarios').doc(pacienteId).collection('planes').add(planParaGuardar);

        console.log(`Plan creado exitosamente con ID: ${ref.id} para el paciente ${pacienteId}`);
        res.status(201).send({ id: ref.id, message: 'Plan creado exitosamente' });

    } catch (error) {
        console.error('Error al crear plan:', error);
        res.status(500).send({ message: 'Error al crear plan.' });
    }
};

export const eliminarPlan = async (req: Request, res: Response) => {
    try {
        const { planId } = req.params;
        const requesterUid = req.user?.uid;
        console.log(`[DELETE] /api/planes/${planId} - Solicitado por ${requesterUid}`);

        if (!requesterUid || !planId) return res.status(400).send({ message: 'Datos faltantes.' });

        let targetUid = requesterUid;
        const queryPacienteId = req.query.pacienteId;

        if (typeof queryPacienteId === 'string') {
            console.log(`Nutricionista eliminando plan de paciente: ${queryPacienteId}`);
            targetUid = queryPacienteId;
        }

        await db.collection('usuarios').doc(targetUid).collection('planes').doc(planId).delete();

        console.log('Plan eliminado correctamente.');
        res.status(200).send({ message: 'Plan eliminado.' });

    } catch (error) {
        console.error('Error al eliminar plan:', error);
        res.status(500).send({ message: 'Error interno.' });
    }
};

export const obtenerTodosLosPlanesGlobal = async (req: Request, res: Response) => {
    try {
        console.log('[GET] /api/nutricionista/todos-los-planes - Obteniendo vista global.');
        const snapshot = await db.collectionGroup('planes').get();

        const planes = snapshot.docs.map(doc => ({
            id: doc.id,
            pacienteId: doc.ref.parent.parent?.id || 'Desconocido',
            nombre: doc.data().nombre,
            descripcion: doc.data().descripcion,
            fecha_asignacion: doc.data().fecha_asignacion?.toMillis?.() || doc.data().fecha_asignacion,
            versiones: doc.data().versiones || {}
        }));

        console.log(`Se encontraron ${planes.length} planes en total.`);
        res.status(200).send(planes);
    } catch (error) {
        console.error('Error al cargar planes globales:', error);
        res.status(500).send({ message: 'Error al cargar planes globales.' });
    }
};