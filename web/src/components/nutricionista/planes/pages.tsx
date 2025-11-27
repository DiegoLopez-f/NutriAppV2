'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import CardPlan from '@/components/CardPlan';
import TableAlimentos from '@/components/TableAlimentos';

// Interfaces para visualización
interface AlimentoBase {
    id: string;
    nombre: string;
    tipo: string;
    cantidadBase: number;
    unidad: string;
    proteina: number;
    carbohidratos: number;
    grasas: number;
    calorias: number;
}

interface Plan {
    id: string;
    pacienteId: string; // ID del dueño del plan
    nombre: string;
    descripcion?: string;
    asignadoA?: string; // Legacy
    versiones: any;
}

export default function PlanesPage() {
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [alimentosBase, setAlimentosBase] = useState<AlimentoBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [versionSeleccionada, setVersionSeleccionada] = useState<{ [planId: string]: string }>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cargar Alimentos y TODOS los planes del sistema
                const [dataAlimentos, dataPlanes] = await Promise.all([
                    api.getAlimentos(),
                    api.getAllPlanes() // Llamada al endpoint collectionGroup
                ]);

                // Parsear Alimentos
                const baseAlimentos = dataAlimentos.map((a: any) => ({
                    id: a.id,
                    nombre: a.nombre,
                    tipo: a.tipo,
                    cantidadBase: parseFloat(a.cantidadBase) || 100,
                    unidad: a.unidad || 'g',
                    proteina: parseFloat(a.proteina) || 0,
                    carbohidratos: parseFloat(a.carbohidratos) || 0,
                    grasas: parseFloat(a.grasas) || 0,
                    calorias: parseFloat(a.calorias) || 0
                }));

                setAlimentosBase(baseAlimentos);
                setPlanes(dataPlanes);

            } catch (error) {
                console.error("Error cargando planes globales:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleToggleVersion = (planId: string, version: string) => {
        setVersionSeleccionada(prev => ({ ...prev, [planId]: version }));
    };

    if (loading) {
        return <div className="text-center mt-10 text-gray-500">Cargando todos los planes...</div>;
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-6 space-y-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Planes Activos</h1>
                    <p className="text-gray-500">Visualización global de todos los planes asignados</p>
                </div>

                <button
                    onClick={() => window.location.href = "/plancreator"}
                    className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-md hover:bg-green-700 transition flex items-center gap-2"
                >
                    <span>+</span> Asignar Nuevo Plan
                </button>
            </div>

            {/* Lista de Planes */}
            {planes.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                    <p className="text-gray-500 text-lg mb-2">No se encontraron planes en el sistema.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {planes.map(plan => {
                        const keys = plan.versiones ? Object.keys(plan.versiones) : [];
                        const activeKey = versionSeleccionada[plan.id] || keys[0];
                        const versionData = plan.versiones ? plan.versiones[activeKey] : null;

                        return (
                            <div key={plan.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-bold text-gray-800">{plan.nombre}</h2>
                                            {/* ETIQUETA: A QUIÉN PERTENECE EL PLAN */}
                                            <span className="inline-block text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase tracking-wide">
                                                Paciente: {plan.pacienteId}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm mt-1">{plan.descripcion}</p>
                                    </div>

                                    {/* Selector Versiones */}
                                    {keys.length > 0 && (
                                        <div className="flex bg-gray-100 p-1 rounded-lg">
                                            {keys.map(key => (
                                                <button
                                                    key={key}
                                                    onClick={() => handleToggleVersion(plan.id, key)}
                                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
                                                        activeKey === key
                                                            ? 'bg-white text-green-700 shadow-sm'
                                                            : 'text-gray-500 hover:text-gray-800'
                                                    }`}
                                                >
                                                    {key}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {versionData ? (
                                    <div className="space-y-6">
                                        {/* Resumen de la versión */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-green-50 p-4 rounded-xl border border-green-100">
                                            <div className="text-center">
                                                <p className="text-xs text-green-800 font-bold uppercase">Calorías</p>
                                                <p className="text-xl font-bold text-green-700">{versionData.calorias}</p>
                                            </div>
                                            <div className="col-span-3 flex items-center text-sm text-green-900">
                                                {versionData.objetivo || "Sin objetivo definido"}
                                            </div>
                                        </div>

                                        {/* Comidas */}
                                        {versionData.comidas && versionData.comidas.map((comida: any, idx: number) => (
                                            <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                                                <div className="bg-gray-50 px-4 py-2 font-bold text-gray-700 border-b border-gray-100 flex justify-between">
                                                    <span>{comida.nombre}</span>
                                                    {/* Mostrar calorias totales si existen en el JSON */}
                                                    {comida.macros?.kcal && <span className="text-xs bg-white border px-2 rounded text-gray-500 flex items-center">{Math.round(comida.macros.kcal)} kcal</span>}
                                                </div>
                                                <div className="p-4">
                                                    <TableAlimentos
                                                        alimentos={comida.alimentos}
                                                        alimentosBase={alimentosBase}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-400 py-8">Selecciona una versión para ver detalles.</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}