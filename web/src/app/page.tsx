'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';

import DashboardPaciente from '@/components/paciente/Dashboard';
import DashboardNutricionista from '@/components/nutricionista/Dashboard';

export default function Home() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [perfil, setPerfil] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                // Estado público: Muestra landing o redirige a login
                // Por ahora redirigimos al login si no es pública
                // router.push('/Login');
                setLoading(false);
                return;
            }

            try {
                const dataPerfil = await api.getPerfil();
                setPerfil(dataPerfil);
            } catch (error) {
                console.error("Error cargando perfil:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (!perfil) {
        // Usuario no autenticado (Landing Page simple)
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
                <h1 className="text-4xl font-bold text-green-700 mb-4">Bienvenido a NutriApp</h1>
                <p className="text-gray-500 mb-8 text-center max-w-md">
                    Tu plataforma integral para el seguimiento nutricional y farmacias de turno.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => router.push('/Login')} className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition">
                        Iniciar Sesión
                    </button>
                    <button onClick={() => router.push('/registro')} className="px-6 py-3 border border-green-600 text-green-600 rounded-lg font-bold hover:bg-green-50 transition">
                        Registrarse
                    </button>
                </div>
            </div>
        );
    }

    // Usuario Autenticado: Redirección por Rol
    // 1 = Nutricionista, 2 = Paciente
    if (perfil.tipo === 1) {
        return <DashboardNutricionista />;
    } else {
        return <DashboardPaciente perfilInicial={perfil} />;
    }
}