import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import admin from 'firebase-admin';


// 2. Importar la llave de Firebase
import serviceAccount from '../serviceAccountKey.json';

declare global {
    namespace Express {
        interface Request {
            user?: admin.auth.DecodedIdToken; // El usuario decodificado
        }
    }
}

// 3. Inicializar Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any)
});

// 4. Inicializar la App de Express
const app = express();
const port = 3000;

// 5. Configurar Middlewares
app.use(cors());
app.use(express.json());

// 6. Definir la base de datos para fácil acceso
const db = admin.firestore();

// 7. Importar la lógica del Plan (el archivo que ya creamos)
import { PlanPayload, calcularMacrosPlan } from './plan-utils';
import * as https from "node:https";

// --- Middleware de Autenticación (El Guardia) ---
async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).send('No autorizado: Se requiere un token.');
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
        return res.status(403).send('No autorizado: Token malformado.');
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(403).send('No autorizado: Token inválido o expirado.');
    }
}

// --- === ENDPOINTS DE LA API === ---

// --- REGISTRAR USUARIO CON ESTRUCTURA CORRECTA ---
app.post('/api/usuarios', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
        const { uid, email, nombre, tipo, perfil_nutricional } = req.body;

        if (!uid || !email) {
            return res.status(400).send({ message: 'Faltan datos obligatorios (uid, email).' });
        }

        // Estructura base según el JSON
        const usuarioBase: any = {
            uid,
            email,
            nombre: nombre || email.split('@')[0],
            tipo: tipo || 2, // Por defecto Paciente (2)
            creadoEn: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Si es Paciente (Tipo 2)
        if (tipo === 2) {
            usuarioBase.perfil_nutricional = {
                altura: perfil_nutricional?.altura || 0,
                peso: perfil_nutricional?.peso || 0,
                objetivo: perfil_nutricional?.objetivo || "",
                alergias: perfil_nutricional?.alergias || [],
                restricciones: perfil_nutricional?.restricciones || []
            };
        }
        // Si es Nutricionista (Tipo 1)
        else if (tipo === 1) {
            usuarioBase.pacientes = []; // Array vacío para asignar pacientes después
            // También puede tener perfil nutricional propio
            usuarioBase.perfil_nutricional = perfil_nutricional || {};
        }

        // Guardar en Firestore con la estructura limpia
        await db.collection('usuarios').doc(uid).set(usuarioBase, { merge: true });

        console.log(`Usuario registrado: ${email} (Tipo ${tipo})`);
        res.status(201).send({ message: 'Usuario registrado correctamente', usuario: usuarioBase });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).send({ message: 'Error interno al registrar usuario.' });
    }
});

// --- OBTENER PACIENTES (PARA DASHBOARD NUTRICIONISTA) ---
app.get('/api/nutricionista/pacientes', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
        // Validamos que quien pide esto sea un Nutricionista (Opcional: verificar en BD su tipo)
        // Por ahora confiamos en que el frontend separa roles, o podrías hacer una consulta extra aquí.

        const snapshot = await db.collection('usuarios')
            .where('tipo', '==', 2) // Solo traemos pacientes
            .get();

        if (snapshot.empty) {
            return res.status(200).send([]);
        }

        const pacientes = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id, // Importante devolver el ID para asignar planes después
                nombre: data.nombre,
                email: data.email,
                tipo: data.tipo,
                perfil_nutricional: data.perfil_nutricional || {}
            };
        });

        res.status(200).send(pacientes);

    } catch (error) {
        console.error('Error obteniendo pacientes:', error);
        res.status(500).send({ message: 'Error al obtener la lista de pacientes.' });
    }
});

// ... (endpoints /api/test, /api/protegido, /api/alimentos) ...
app.get('/api/test', (req: Request, res: Response) => {
    res.status(200).send({ message: '¡Hola desde tu backend con TypeScript!' });
});
app.get('/api/protegido', verifyFirebaseToken, (req: Request, res: Response) => {
    res.status(200).send({
        message: `¡Bienvenido, ${req.user?.email}!`,
        tuUID: req.user?.uid,
    });
});
app.get('/api/alimentos', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
        const alimentosSnapshot = await db.collection('alimentos').get();
        const alimentosList = alimentosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.status(200).send(alimentosList);
    } catch (error) {
        console.error('Error al obtener alimentos:', error);
        res.status(500).send({ message: 'Error interno del servidor.' });
    }
});


// ... (endpoint GET /api/planes/asignados) ...
app.get('/api/planes/asignados', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            return res.status(403).send({ message: 'Usuario no válido.' });
        }

        console.log(`Buscando planes asignados para el UID: ${uid}`);
        const planesSnapshot = await db.collection('usuarios').doc(uid).collection('planes').get();

        if (planesSnapshot.empty) {
            console.log('No se encontraron planes para este usuario.');
            return res.status(200).send([]);
        }

        const planesList = planesSnapshot.docs.map(planDoc => {
            const planData = planDoc.data();

            // Convertir el Timestamp a Long
            let fechaAsignacionLong: number | null = null;
            const fechaAsignacionData = planData.fecha_asignacion;

            if (fechaAsignacionData && typeof fechaAsignacionData.toMillis === 'function') {
                fechaAsignacionLong = fechaAsignacionData.toMillis();
            } else if (typeof fechaAsignacionData === 'number') {
                fechaAsignacionLong = fechaAsignacionData;
            }

            return {
                id: planDoc.id,
                nombre: planData.nombre,
                descripcion: planData.descripcion,
                versiones: planData.versiones,
                fecha_asignacion: fechaAsignacionLong
            };
        });

        res.status(200).send(planesList);

    } catch (error) {
        console.error('Error al obtener planes asignados:', error);
        res.status(500).send({ message: 'Error interno del servidor.' });
    }
});


// --- POST PLANES (Acepta descripcion y objetivo) ---
app.post('/api/planes', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
        const nutricionistaUid = req.user?.uid;
        if (!nutricionistaUid) {
            return res.status(403).send({ message: 'Usuario (Nutricionista) no válido.' });
        }

        // 1. OBTENER Y VALIDAR DATOS (Añadimos nuevos campos)
        const { pacienteId, descripcionPlan, objetivo, ...planData } =
            req.body as (PlanPayload & { pacienteId: string, descripcionPlan?: string, objetivo?: string });

        if (!pacienteId) {
            return res.status(400).send({ message: "Se requiere un 'pacienteId' para crear el plan." });
        }
        if (!planData.nombre || !planData.tipo || !planData.comidas) {
            return res.status(400).send({ message: 'Datos del plan incompletos (nombre, tipo, comidas).' });
        }

        // 2. CALCULAR
        const { comidasParaGuardar, totalesDiarios } = await calcularMacrosPlan(db, planData.comidas);

        if (comidasParaGuardar.length === 0) {
            return res.status(400).send({ message: 'El plan debe contener al menos un alimento válido.' });
        }

        // 3. PREPARAR LA VERSIÓN (Añadimos objetivo)
        const versionId = planData.tipo.toLowerCase().replace('ó', 'o');
        const versionData = {
            tipo: planData.tipo,
            calorias: totalesDiarios.kcal,
            distribucion_macros: { proteina: 0, carbohidratos: 0, grasas: 0 },
            objetivo: objetivo || 'Objetivo no especificado', // <-- ¡¡NUEVO!!
            comidas: comidasParaGuardar,
            totales_diarios: totalesDiarios,
            notas_tecnicas: [],
        };

        // 4. PREPARAR EL PLAN (Añadimos descripción)
        const planParaGuardar = {
            nombre: planData.nombre.trim(),
            descripcion: descripcionPlan || `Plan ${planData.tipo} creado por Nutricionista ${nutricionistaUid}`, // <-- ¡¡NUEVO!!
            fecha_asignacion: admin.firestore.FieldValue.serverTimestamp(),
            versiones: {
                [versionId]: versionData
            }
        };

        // 5. GUARDAR
        const planRef = await db.collection('usuarios').doc(pacienteId).collection('planes').add(planParaGuardar);

        console.log(`Plan ${planRef.id} creado para ${pacienteId} (con campos extra)`);
        res.status(201).send({
            id: planRef.id,
            message: 'Plan creado exitosamente',
        });

    } catch (error) {
        console.error('Error al crear plan:', error);
        res.status(500).send({ message: 'Error interno del servidor al crear el plan.' });
    }
});


// --- ELIMINAR PLAN (Paciente o Nutricionista) ---
app.delete('/api/planes/:planId', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
        // 1. Validar Plan ID
        const { planId } = req.params;
        if (!planId) {
            return res.status(400).send({ message: 'Falta el ID del plan.' });
        }

        // 2. Validar Usuario solicitante
        const requesterUid = req.user?.uid;
        if (!requesterUid) {
            return res.status(403).send({ message: 'Usuario no válido.' });
        }

        // 3. Determinar de quién borramos (targetUid)
        // Inicializamos targetUid con el ID del solicitante (por defecto borra lo suyo)
        let targetUid: string = requesterUid;

        // Verificamos si viene un pacienteId válido en la URL (query param)
        // Express puede devolver string, array o undefined, así que forzamos la verificación.
        const queryPacienteId = req.query.pacienteId;

        if (queryPacienteId && typeof queryPacienteId === 'string') {
            console.log(`Nutricionista ${requesterUid} eliminando plan de ${queryPacienteId}`);
            targetUid = queryPacienteId;
        } else {
            console.log(`Usuario ${requesterUid} eliminando su propio plan`);
        }

        // 4. Ejecutar el borrado (Ahora targetUid y planId son 100% string)
        await db.collection('usuarios').doc(targetUid).collection('planes').doc(planId).delete();

        res.status(200).send({ message: 'Plan eliminado exitosamente.' });

    } catch (error) {
        console.error('Error al eliminar el plan:', error);
        res.status(500).send({ message: 'Error interno del servidor.' });
    }
});

// --- GET /api/perfil ---
app.get('/api/perfil', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            return res.status(403).send({ message: 'Token de usuario no válido.' });
        }

        const userRef = db.collection('usuarios').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            // (Mantenemos la lógica de 'crear si no existe' por si acaso,
            // pero ahora sabemos que el problema era otro)
            console.log(`Perfil no encontrado para ${uid}. Creando perfil...`);
            const email = req.user?.email || 'desconocido';
            const nombreUsuario = email.split('@')[0];

            const nuevoUsuario = {
                uid: uid,
                email: email,
                nombre: nombreUsuario,
                peso: null,
                altura: null,
                objetivo: null,
                creadoEn: Date.now(), // ¡Enviamos un Long de inmediato!
                actualizadoEn: Date.now() // ¡Enviamos un Long de inmediato!
            };

            // Guardamos y devolvemos el nuevo usuario
            await userRef.set(nuevoUsuario);
            return res.status(200).send(nuevoUsuario);

        } else {
            // 4. SI YA EXISTE: Lo leemos y CONVERTIMOS los Timestamps
            console.log(`Perfil encontrado para ${uid}.`);
            const userData = userDoc.data()!; // '!' porque sabemos que existe

            // --- ¡¡AQUÍ ESTÁ LA CORRECCIÓN!! ---
            const creadoEnData = userData.creadoEn;
            const actualizadoEnData = userData.actualizadoEn;

            // Convertir 'creadoEn'
            let creadoEnLong: number | null = null;
            if (creadoEnData && typeof creadoEnData.toMillis === 'function') {
                creadoEnLong = creadoEnData.toMillis();
            } else if (typeof creadoEnData === 'number') {
                creadoEnLong = creadoEnData;
            } else {
                creadoEnLong = Date.now(); // Fallback
            }

            // Convertir 'actualizadoEn'
            let actualizadoEnLong: number | null = null;
            if (actualizadoEnData && typeof actualizadoEnData.toMillis === 'function') {
                actualizadoEnLong = actualizadoEnData.toMillis();
            } else if (typeof actualizadoEnData === 'number') {
                actualizadoEnLong = actualizadoEnData;
            } else {
                actualizadoEnLong = Date.now(); // Fallback
            }

            return res.status(200).send({
                ...userData, // Todos los demás campos (uid, nombre, email, etc.)
                creadoEn: creadoEnLong,
                actualizadoEn: actualizadoEnLong
            });
        }

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).send({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para ACTUALIZAR el perfil del usuario logueado.
app.put('/api/perfil', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
        console.log("Body recibido:", JSON.stringify(req.body, null, 2));
        const uid = req.user?.uid;
        if (!uid) {
            return res.status(403).send({ message: 'Usuario no válido.' });
        }

        // 1. Obtener los datos del body
        // Ahora esperamos 'perfil_nutricional' como objeto, además del nombre
        const { nombre, perfil_nutricional } = req.body;

        const updates: { [key: string]: any } = {
            actualizadoEn: admin.firestore.FieldValue.serverTimestamp()
        };

        // 2. Construir el objeto de actualización

        // Actualizar nombre si viene
        if (nombre !== undefined) updates.nombre = nombre;

        // Actualizar campos del perfil nutricional si viene el objeto
        if (perfil_nutricional && typeof perfil_nutricional === 'object') {
            const { peso, altura, objetivo } = perfil_nutricional;

            // Usamos notación de punto para actualizar SOLO lo que cambió dentro del mapa
            // sin borrar otros datos que pudieran existir ahí (como alergias).
            if (peso !== undefined) updates['perfil_nutricional.peso'] = peso;
            if (altura !== undefined) updates['perfil_nutricional.altura'] = altura;
            if (objetivo !== undefined) updates['perfil_nutricional.objetivo'] = objetivo;
        }

        // 3. Actualizar el documento en Firestore
        const userRef = db.collection('usuarios').doc(uid);
        await userRef.update(updates);

        // 4. Devolver el documento actualizado
        const updatedDoc = await userRef.get();
        res.status(200).send(updatedDoc.data());

    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).send({ message: 'Error interno del servidor.' });
    }
});

// --- OBTENER TODOS LOS PLANES (Vista Global Nutricionista) ---
app.get('/api/nutricionista/todos-los-planes', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
        // "collectionGroup" busca en TODAS las colecciones que se llamen 'planes',
        // sin importar dentro de qué usuario estén.
        const planesSnapshot = await db.collectionGroup('planes').get();

        const planes = planesSnapshot.docs.map(doc => {
            const data = doc.data();

            // Truco: Como es collectionGroup, el 'ref' nos dice de quién es.
            // doc.ref.parent.parent?.id nos da el ID del usuario dueño del plan.
            const pacienteId = doc.ref.parent.parent?.id || 'Desconocido';

            return {
                id: doc.id,
                pacienteId: pacienteId, // Para saber de quién es
                nombre: data.nombre,
                descripcion: data.descripcion,
                // Convertir fecha si existe
                fecha_asignacion: data.fecha_asignacion?.toMillis?.() || data.fecha_asignacion,
                versiones: data.versiones || {}
            };
        });

        res.status(200).send(planes);

    } catch (error) {
        console.error('Error al obtener todos los planes:', error);
        res.status(500).send({ message: 'Error al cargar los planes globales.' });
    }
});

// --- OBTENER PACIENTES (PARA DASHBOARD NUTRICIONISTA) ---
app.get('/api/nutricionista/pacientes', verifyFirebaseToken, async (req: Request, res: Response) => {
    const requesterUid = req.user?.uid;

    try {
        if (!requesterUid) {
            return res.status(403).send({ message: 'Usuario (Nutricionista) no válido.' });
        }

        // 1. Obtener el documento del Nutricionista para obtener sus referencias de pacientes
        const nutriDoc = await db.collection('usuarios').doc(requesterUid).get();
        const nutriData = nutriDoc.data();

        if (!nutriDoc.exists || nutriData?.tipo !== 1) {
            console.log(`Acceso denegado a lista de pacientes para UID: ${requesterUid}`);
            // Devolvemos lista vacía si no es nutricionista o no existe
            return res.status(200).send([]);
        }

        // 2. Extraer la lista de referencias de pacientes
        // Asumimos que la estructura es: { pacientes: [{ pacienteId: 'email' }, ...] }
        const pacientesReferencias: Array<{ pacienteId: string }> = nutriData.pacientes || [];

        // Mapear a una lista simple de los identificadores (ej: emails)
        const pacienteIds = pacientesReferencias
            .map(ref => ref.pacienteId)
            .filter(id => id); // Filtrar IDs vacíos

        if (pacienteIds.length === 0) {
            return res.status(200).send([]);
        }

        // 3. Consultar los documentos completos de los pacientes
        const BATCH_SIZE = 10;
        let pacientesCompletos: any[] = [];

        // Firestore solo permite 10 elementos en la consulta 'in', así que iteramos en lotes.
        for (let i = 0; i < pacienteIds.length; i += BATCH_SIZE) {
            const batchIds = pacienteIds.slice(i, i + BATCH_SIZE);

            // Usamos 'email' como campo de búsqueda, ya que tu modelo de datos usa el email en pacienteId.
            const snapshot = await db.collection('usuarios')
                .where('email', 'in', batchIds)
                .where('tipo', '==', 2) // Filtro adicional de seguridad
                .get();

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                // Construimos el objeto que espera la app móvil (data class Usuario)
                pacientesCompletos.push({
                    uid: doc.id, // UID real del documento, necesario para la app
                    nombre: data.nombre,
                    email: data.email,
                    tipo: data.tipo,
                    perfil_nutricional: data.perfil_nutricional || {}
                });
            });
        }
        
        // 4. Devolver la lista completa de objetos Usuario (pacientes)
        res.status(200).send(pacientesCompletos);

    } catch (error) {
        console.error('Error obteniendo pacientes:', error);
        res.status(500).send({ message: 'Error al obtener la lista de pacientes.' });
    }
});

// 8. Iniciar el servidor
app.listen(port, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${port}`);
});