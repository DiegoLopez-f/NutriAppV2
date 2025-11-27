'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api"; // Usamos la API

// Interfaces alineadas con tu Backend
interface PerfilNutricional {
    altura: number;
    peso: number;
    objetivo: string;
    alergias?: string[];
}

interface Paciente {
    uid: string; // Ahora usamos uid en vez de email como clave principal
    nombre: string;
    email: string;
    tipo: number;
    perfil_nutricional: PerfilNutricional;
}

// ... (Interfaz Plan si la necesitas)

export default function DashboardNutricionista() {
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Cargar Pacientes desde el Backend
                const dataPacientes = await api.getPacientes();
                setPacientes(dataPacientes);

                // ... (Cargar planes si lo necesitas) ...

            } catch (error) {
                console.error("Error cargando dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="text-center mt-10 text-gray-500">Cargando pacientes...</div>;

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Nutricionista</h1>
                    <p className="text-gray-600">Gestiona tus pacientes y planes</p>
                </div>
                <Link href="/nutricionista/planes" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                    Ver Planes Maestros
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pacientes.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500">No tienes pacientes registrados.</p>
                ) : (
                    pacientes.map((paciente) => (
                        <div key={paciente.uid} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{paciente.nombre}</h3>
                                    <p className="text-sm text-gray-500">{paciente.email}</p>
                                </div>
                                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-semibold">
                                    Paciente
                                </span>
                            </div>

                            <div className="text-sm text-gray-600 space-y-1 mb-4">
                                <p><strong>Objetivo:</strong> {paciente.perfil_nutricional.objetivo || "Sin definir"}</p>
                                <p><strong>Peso:</strong> {paciente.perfil_nutricional.peso || "--"} kg</p>
                            </div>

                            <div className="flex gap-2 mt-4">
                                {/* Copiamos el ID para usarlo en PlanCreator */}
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(paciente.uid);
                                        alert("ID copiado: " + paciente.uid);
                                    }}
                                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 text-sm font-medium"
                                >
                                    Copiar ID
                                </button>
                                <Link
                                    href={`/paciente/${paciente.uid}/planes`} // Ruta futura para ver detalle
                                    className="flex-1 bg-green-50 text-green-700 py-2 rounded hover:bg-green-100 text-center text-sm font-medium"
                                >
                                    Ver Historial
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}