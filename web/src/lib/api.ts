import { auth } from "./firebase";

// Usamos la variable de entorno, con fallback a localhost
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Helper interno para no repetir código
async function authFetch(endpoint: string, options: RequestInit = {}) {
    const user = auth.currentUser;

    // Obtenemos el token si hay usuario, si no (ej: registro), el backend validará o no según la ruta.
    // Nota: Para '/usuarios' (registro) a veces no hay token previo si es creación pública,
    // pero como usamos Firebase Client SDK antes, sí tendremos usuario logueado en el cliente.
    let token = "";
    if (user) {
        token = await user.getIdToken();
    }

    // Headers por defecto + Auth
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
    };

    // Ejecutar fetch
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Manejo básico de errores HTTP
    if (!response.ok) {
        // Intentamos leer el mensaje de error del backend si existe
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
            const errorBody = await response.json();
            if (errorBody.message) errorMessage = errorBody.message;
        } catch (e) {
            // Si no es JSON, nos quedamos con el error genérico
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

// Interfaces
export interface PlanPayload {
    pacienteId: string;
    nombre: string;
    tipo: 'Volumen' | 'Recomposición';
    descripcionPlan?: string;
    objetivo?: string;
    comidas: any[];
}

// Objeto API principal
export const api = {
    // --- USUARIOS Y PERFIL ---
    getPerfil: async () => {
        return authFetch('/perfil');
    },

    actualizarPerfil: async (datos: Record<string, any>) => {
        return authFetch('/perfil', {
            method: 'PUT',
            body: JSON.stringify(datos)
        });
    },

    // NUEVO: Registrar usuario con estructura correcta
    registrarUsuario: async (payload: any) => {
        return authFetch('/usuarios', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    // --- ALIMENTOS ---
    getAlimentos: async () => {
        return authFetch('/alimentos');
    },

    // --- PLANES (Operaciones Generales) ---
    crearPlan: async (payload: PlanPayload) => {
        return authFetch('/planes', {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

        // UNIFICADO: Si pasas pacienteId, el backend sabe que debe borrar de otro usuario.
        eliminarPlan: async (planId: string, pacienteId?: string) => {
            // Construimos la URL base
            let endpoint = `/planes/${planId}`;

            // Si hay pacienteId, lo adjuntamos como Query Param (?pacienteId=...)
            if (pacienteId) {
                endpoint += `?pacienteId=${pacienteId}`;
            }

            return authFetch(endpoint, {
                method: 'DELETE'
            });
        },

    // --- VISTAS ESPECÍFICAS ---

    // Para el PACIENTE: Ver solo sus planes asignados
    getMisPlanes: async () => {
        return authFetch('/planes/asignados');
    },

    // Para el NUTRICIONISTA: Ver lista de pacientes
    getPacientes: async () => {
        return authFetch('/nutricionista/pacientes');
    },

    // NUEVO: Para el NUTRICIONISTA: Ver TODOS los planes globales
    getAllPlanes: async () => {
        return authFetch('/nutricionista/todos-los-planes');
    },

    // NUEVO: Obtener farmacias de turno (Pública o Privada, aquí usamos authFetch por consistencia)
    getFarmacias: async () => {
        // Nota: Como es un servicio público, podríamos usar fetch normal,
        // pero usar authFetch mantiene la seguridad de tu backend si decides protegerlo.
        return authFetch('/farmacias');
    }
};