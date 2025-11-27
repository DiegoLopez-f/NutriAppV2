'use client';

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import { api } from "@/lib/api";
import { ArrowPathIcon, ScaleIcon, ListBulletIcon, UserIcon, ChartBarIcon } from '@heroicons/react/24/solid';

// Interfaces
interface Macros { proteinas: number; carbohidratos: number; grasas: number; kcal: number; }
interface PlanVersion {
    tipo: 'Volumen' | 'Recomposición';
    calorias: number;
    notas_tecnicas?: string[];
    totales_diarios?: Macros;
    macros_total?: Macros;
}
interface Plan {
    id: string;
    nombre: string;
    descripcion?: string;
    versiones: { [key: string]: PlanVersion };
}

interface DashboardProps {
    perfilInicial?: any;
}

const Dashboard: React.FC<DashboardProps> = ({ perfilInicial }) => {
    const [paciente, setPaciente] = useState<any>(perfilInicial || null);
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(!perfilInicial);
    const [versionSeleccionada, setVersionSeleccionada] = useState<{ [planId: string]: string }>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                if (!paciente) {
                    const dataPerfil = await api.getPerfil();
                    setPaciente(dataPerfil);
                }
                const dataPlanes = await api.getMisPlanes();
                setPlanes(dataPlanes);
            } catch (error) {
                console.error("Error cargando dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [paciente]);

    if (loading) return <div className="text-center mt-10 text-gray-400">Sincronizando datos...</div>;
    if (!paciente) return <div className="text-center mt-10">No se pudo cargar el perfil.</div>;

    // --- ACCESO A DATOS (CORREGIDO) ---
    // Buscamos en 'perfil_nutricional' primero, o fallbacks a la raíz para usuarios antiguos
    const perfil = paciente.perfil_nutricional || {};
    const peso = perfil.peso || paciente.peso;
    const altura = perfil.altura || paciente.altura;
    const objetivo = perfil.objetivo || paciente.objetivo || "Sin definir";

    // Calculamos IMC si hay datos
    const imc = (peso && altura)
        ? (peso / ((altura / 100) ** 2)).toFixed(1)
        : "--";

    // --- Lógica del Plan Activo ---
    const planActivo = planes.length > 0 ? planes[0] : null;
    const keysVersiones = planActivo ? Object.keys(planActivo.versiones || {}) : [];
    const keyVolumen = keysVersiones.find(k => k.toLowerCase().includes('volumen'));
    const keyRecomp = keysVersiones.find(k => k.toLowerCase().includes('recomp'));
    const activeKey = planActivo ? (versionSeleccionada[planActivo.id] || keyVolumen || keyRecomp || keysVersiones[0]) : null;
    const dataVersion = (planActivo && activeKey) ? planActivo.versiones[activeKey] : null;
    const macros = dataVersion?.totales_diarios || dataVersion?.macros_total || { proteinas: 0, carbohidratos: 0, grasas: 0, kcal: 0 };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">

            {/* 1. SECCIÓN DE PERFIL */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-white p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Hola, <span className="text-green-600">{paciente.nombre}</span> 👋
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Aquí tienes tu resumen personal actualizado.
                        </p>
                    </div>
                    <Link href={`/paciente/planes`}>
                        <button className="flex items-center gap-2 bg-white text-green-700 border border-green-200 font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-green-50 transition text-sm">
                            <ListBulletIcon className="w-4 h-4" />
                            Historial
                        </button>
                    </Link>
                </div>

                {/* Estadísticas del Paciente (Usando las variables corregidas) */}
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 p-6">
                    <div className="px-4 text-center">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Peso Actual</p>
                        <p className="text-xl font-bold text-gray-800">{peso || "--"} <span className="text-xs font-normal text-gray-400">kg</span></p>
                    </div>
                    <div className="px-4 text-center">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Altura</p>
                        <p className="text-xl font-bold text-gray-800">{altura || "--"} <span className="text-xs font-normal text-gray-400">cm</span></p>
                    </div>
                    <div className="px-4 text-center">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">IMC</p>
                        <p className="text-xl font-bold text-blue-600">{imc}</p>
                    </div>
                    <div className="px-4 text-center">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Objetivo</p>
                        <p className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded inline-block truncate max-w-full">
                            {objetivo}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. SECCIÓN DEL PLAN */}
            {!planActivo ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <UserIcon className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 mb-2">Aún no tienes un plan asignado</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Tu nutricionista está trabajando en tu pauta. Apenas esté lista, aparecerá aquí.
                    </p>
                    <div className="inline-flex gap-2 text-xs text-gray-400 bg-white px-3 py-2 rounded border border-gray-200">
                        <ChartBarIcon className="w-4 h-4" />
                        Perfil completado correctamente
                    </div>
                </div>
            ) : (
                // Tarjeta de Plan Activo
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xl shadow-green-900/5 transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-100 pb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">PLAN ACTIVO</span>
                                <h2 className="text-2xl font-bold text-gray-800">{planActivo.nombre}</h2>
                            </div>
                            {planActivo.descripcion && <p className="text-gray-500 text-sm">{planActivo.descripcion}</p>}
                        </div>

                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {keyVolumen && (
                                <button
                                    onClick={() => setVersionSeleccionada(prev => ({ ...prev, [planActivo.id]: keyVolumen }))}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                        activeKey === keyVolumen
                                            ? 'bg-white text-green-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <ScaleIcon className="w-4 h-4 inline-block mr-1.5" /> Volumen
                                </button>
                            )}
                            {keyRecomp && (
                                <button
                                    onClick={() => setVersionSeleccionada(prev => ({ ...prev, [planActivo.id]: keyRecomp }))}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                        activeKey === keyRecomp
                                            ? 'bg-white text-cyan-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <ArrowPathIcon className="w-4 h-4 inline-block mr-1.5" /> Recomposición
                                </button>
                            )}
                        </div>
                    </div>

                    {dataVersion ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="col-span-2 md:col-span-1 p-5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-md flex flex-col items-center justify-center">
                                    <span className="text-green-100 text-xs font-bold uppercase tracking-wider mb-1">Calorías</span>
                                    <span className="text-4xl font-extrabold">{dataVersion.calorias}</span>
                                    <span className="text-sm font-medium opacity-80">kcal/día</span>
                                </div>
                                <MacroCard label="Proteínas" value={macros.proteinas} color="text-blue-700" bg="bg-blue-50" />
                                <MacroCard label="Carbohidratos" value={macros.carbohidratos} color="text-orange-700" bg="bg-orange-50" />
                                <MacroCard label="Grasas" value={macros.grasas} color="text-yellow-700" bg="bg-yellow-50" />
                            </div>

                            {dataVersion.notas_tecnicas && dataVersion.notas_tecnicas.length > 0 && (
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center text-sm uppercase tracking-wide">
                                        <span className="w-1.5 h-4 bg-green-500 rounded-full mr-2"></span>
                                        Instrucciones
                                    </h3>
                                    <ul className="space-y-3">
                                        {dataVersion.notas_tecnicas.map((nota, idx) => (
                                            <li key={idx} className="flex items-start text-gray-600 text-sm">
                                                <span className="mr-3 text-green-500 font-bold">•</span>
                                                {nota}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            Selecciona una versión para ver los detalles
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const MacroCard = ({ label, value, color, bg }: { label: string, value: number, color: string, bg: string }) => (
    <div className={`p-4 rounded-xl border border-transparent ${bg} flex flex-col items-center justify-center transition hover:scale-[1.02]`}>
        <span className={`text-xs font-bold uppercase tracking-wider opacity-70 mb-1 ${color}`}>{label}</span>
        <span className={`text-2xl font-extrabold ${color}`}>{Math.round(value)}g</span>
    </div>
);

export default Dashboard;