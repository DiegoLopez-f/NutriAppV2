'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';

// Importamos los Dashboards (asegúrate de que las rutas sean correctas)
import DashboardPaciente from '@/components/paciente/Dashboard';
import DashboardNutricionista from '@/components/nutricionista/Dashboard'; // Lo mantenemos aunque sea placeholder por ahora

export default function Home() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [perfil, setPerfil] = useState<any>(null);

    useEffect(() => {
        // Escuchamos el estado de autenticación de Firebase
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                // Si no hay usuario, mandamos al login
                router.push('/Login');
                return;
            }

            setUser(currentUser);

            try {
                // Si hay usuario, pedimos su perfil a TU BACKEND
                const dataPerfil = await api.getPerfil();
                setPerfil(dataPerfil);
            } catch (error) {
                console.error("Error cargando perfil:", error);
                // Si falla el perfil, podrías mostrar un error o reintentar
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
                <p className="mt-4 text-gray-500 font-medium">Cargando tu experiencia NutriApp...</p>
            </div>
        );
    }

    if (!perfil) {
        return <div className="p-10 text-center">Error al cargar tu perfil. Intenta recargar.</div>;
    }

    // LÓGICA DE ROLES
    // Asumimos: 1 = Nutricionista, 2 = Paciente (según tu código anterior)
    // Si tu backend no devuelve 'tipo', tendrás que agregarlo a tu modelo de usuario en backend.
    if (perfil.tipo === 1) {
        return <DashboardNutricionista />;
    } else {
        // Por defecto o si es tipo 2, mostramos el de Paciente
        // Pasamos el perfil ya cargado para no pedirlo dos veces
        return <DashboardPaciente perfilInicial={perfil} />;
    }
}