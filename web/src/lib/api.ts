import { auth } from "./firebase";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

async function authFetch(endpoint: string, options: RequestInit = {}) {
    const user = auth.currentUser;
    let token = "";

    if (user) {
        token = await user.getIdToken();
    }

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
            const errorBody = await response.json();
            if (errorBody.message) errorMessage = errorBody.message;
        } catch (e) {
            // Ignorar error de parseo
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

export interface PlanPayload {
    pacienteId: string;
    nombre: string;
    tipo: 'Volumen' | 'Recomposición';
    descripcionPlan?: string;
    objetivo?: string;
    comidas: any[];
}

export const api = {
    getPerfil: async () => {
        return authFetch('/perfil');
    },

    actualizarPerfil: async (datos: Record<string, any>) => {
        return authFetch('/perfil', {
            method: 'PUT',
            body: JSON.stringify(datos)
        });
    },

    registrarUsuario: async (payload: any) => {
        return authFetch('/usuarios', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    getAlimentos: async () => {
        return authFetch('/alimentos');
    },

    crearPlan: async (payload: PlanPayload) => {
        return authFetch('/planes', {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    eliminarPlan: async (planId: string, pacienteId?: string) => {
        let endpoint = `/planes/${planId}`;
        if (pacienteId) {
            endpoint += `?pacienteId=${pacienteId}`;
        }
        return authFetch(endpoint, {
            method: 'DELETE'
        });
    },

    getMisPlanes: async () => {
        return authFetch('/planes/asignados');
    },

    getPacientes: async () => {
        return authFetch('/nutricionista/pacientes');
    },

    getAllPlanes: async () => {
        return authFetch('/nutricionista/todos-los-planes');
    },

    getFarmacias: async () => {
        // Nota: Farmacias usa fetch directo en el componente para evitar CORS en algunos casos,
        // pero mantenemos este método por si el backend proxy se habilita a futuro.
        return authFetch('/farmacias');
    }
};