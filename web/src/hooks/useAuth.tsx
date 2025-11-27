'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { api } from '@/services/api';

interface AuthState {
    user: User | null;
    role: string | null;
    loading: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        role: null,
        loading: true,
    });

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Intentamos obtener el rol desde el backend
                    const perfil = await api.getPerfil();
                    setAuthState({
                        user,
                        role: perfil.role || 'paciente', // Fallback a paciente si no hay rol
                        loading: false,
                    });
                } catch (error) {
                    console.error("Error obteniendo rol:", error);
                    // Si falla la API pero estamos logueados en Firebase,
                    // asumimos un rol seguro (paciente) para no bloquear la app
                    setAuthState({
                        user,
                        role: 'paciente',
                        loading: false,
                    });
                }
            } else {
                // No hay usuario logueado
                setAuthState({
                    user: null,
                    role: null,
                    loading: false,
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return authState;
}