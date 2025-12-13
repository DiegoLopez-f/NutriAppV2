import { Request, Response } from 'express';
import { db } from '../config/firebase';
import admin from 'firebase-admin';

// --- Registrar Usuario ---
export const registrarUsuario = async (req: Request, res: Response) => {
    try {
        console.log(`[POST] /api/usuarios - Intentando registrar usuario: ${req.body.email}`);
        const { uid, email, nombre, tipo, perfil_nutricional } = req.body;

        if (!uid || !email) {
            console.log('Error: Faltan datos obligatorios.');
            return res.status(400).send({ message: 'Faltan datos obligatorios.' });
        }

        const usuarioBase: any = {
            uid, email,
            nombre: nombre || email.split('@')[0],
            tipo: tipo || 2,
            creadoEn: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (tipo === 2) { // Paciente
            usuarioBase.perfil_nutricional = {
                altura: perfil_nutricional?.altura || 0,
                peso: perfil_nutricional?.peso || 0,
                objetivo: perfil_nutricional?.objetivo || "",
                alergias: perfil_nutricional?.alergias || [],
                restricciones: perfil_nutricional?.restricciones || []
            };
        } else if (tipo === 1) { // Nutricionista
            usuarioBase.pacientes = [];
            usuarioBase.perfil_nutricional = perfil_nutricional || {};
        }

        await db.collection('usuarios').doc(uid).set(usuarioBase, { merge: true });

        console.log(`Usuario registrado exitosamente: ${email} (Tipo ${tipo})`);
        res.status(201).send({ message: 'Usuario registrado', usuario: usuarioBase });

    } catch (error) {
        console.error('Error interno al registrar usuario:', error);
        res.status(500).send({ message: 'Error interno.' });
    }
};

// --- Obtener Perfil ---
export const obtenerPerfil = async (req: Request, res: Response) => {
    try {
        const uid = req.user?.uid;
        console.log(`[GET] /api/perfil - Solicitado por: ${uid}`);

        if (!uid) return res.status(403).send({ message: 'Token inválido.' });

        const userRef = db.collection('usuarios').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.log(`Perfil no encontrado para ${uid}. Creando perfil por defecto...`);
            const nuevoUsuario = {
                uid, email: req.user?.email, nombre: req.user?.email?.split('@')[0],
                creadoEn: Date.now(), actualizadoEn: Date.now()
            };
            await userRef.set(nuevoUsuario);
            return res.status(200).send(nuevoUsuario);
        }

        const userData = userDoc.data()!;

        // Conversión de timestamps para evitar errores en el frontend
        const convertirFecha = (fecha: any) =>
            (fecha && typeof fecha.toMillis === 'function') ? fecha.toMillis() : (fecha || Date.now());

        console.log('Perfil obtenido correctamente.');
        return res.status(200).send({
            ...userData,
            creadoEn: convertirFecha(userData.creadoEn),
            actualizadoEn: convertirFecha(userData.actualizadoEn)
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).send({ message: 'Error interno.' });
    }
};

// --- Actualizar Perfil ---
export const actualizarPerfil = async (req: Request, res: Response) => {
    try {
        const uid = req.user?.uid;
        console.log(`[PUT] /api/perfil - Actualizando perfil para: ${uid}`);

        if (!uid) return res.status(403).send({ message: 'Usuario no válido.' });

        const { nombre, perfil_nutricional } = req.body;
        const updates: any = { actualizadoEn: admin.firestore.FieldValue.serverTimestamp() };

        if (nombre !== undefined) updates.nombre = nombre;
        if (perfil_nutricional && typeof perfil_nutricional === 'object') {
            const { peso, altura, objetivo } = perfil_nutricional;
            if (peso !== undefined) updates['perfil_nutricional.peso'] = peso;
            if (altura !== undefined) updates['perfil_nutricional.altura'] = altura;
            if (objetivo !== undefined) updates['perfil_nutricional.objetivo'] = objetivo;
        }

        await db.collection('usuarios').doc(uid).update(updates);

        const updatedDoc = await db.collection('usuarios').doc(uid).get();
        console.log('Perfil actualizado exitosamente.');
        res.status(200).send(updatedDoc.data());

    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).send({ message: 'Error al actualizar.' });
    }
};

// --- Obtener Pacientes (Nutricionista) ---
export const obtenerPacientes = async (req: Request, res: Response) => {
    try {
        console.log(`[GET] /api/nutricionista/pacientes - Solicitado por Nutricionista: ${req.user?.uid}`);

        // LÓGICA CORREGIDA: Traer TODOS los pacientes (Tipo 2), igual que antes.
        // Si quieres filtrar solo los "asignados", necesitaríamos lógica extra en el frontend.
        const snapshot = await db.collection('usuarios')
            .where('tipo', '==', 2) // Solo traemos pacientes
            .get();

        if (snapshot.empty) {
            console.log('No se encontraron pacientes en la base de datos.');
            return res.status(200).send([]);
        }

        const pacientes = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                nombre: data.nombre,
                email: data.email,
                tipo: data.tipo,
                perfil_nutricional: data.perfil_nutricional || {}
            };
        });

        console.log(`Se encontraron ${pacientes.length} pacientes.`);
        res.status(200).send(pacientes);

    } catch (error) {
        console.error('Error obteniendo pacientes:', error);
        res.status(500).send({ message: 'Error al obtener la lista de pacientes.' });
    }
};