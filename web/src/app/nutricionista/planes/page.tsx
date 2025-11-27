'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api'; // Cliente API
import {
    TrashIcon,
    UserIcon,
    PlusIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/solid';

// =========================================================================
// 1. UTILIDADES
// =========================================================================

const parseNumber = (value: any): number => {
    const num = parseFloat(value);
    return isNaN(num) || num === null || value === undefined ? 0 : num;
};

const parseCantidad = (cantidadStr: string): number => {
    return parseNumber(String(cantidadStr).replace(/[^0-9.]/g, ''));
};

// =========================================================================
// 2. INTERFACES
// =========================================================================

interface PlanAlimento {
    refAlimento: string;
    cantidad: string;
}

interface Macros {
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    kcal: number;
}

interface Comida {
    nombre: string;
    descripcion?: string;
    alimentos: PlanAlimento[];
    macros?: Macros;
}

interface VersionPlan {
    tipo: string;
    calorias: number;
    objetivo?: string;
    comidas: Comida[];
    totales_diarios?: Macros;
    macros_total?: Macros;
    notas_tecnicas?: string[];
}

interface Plan {
    id: string;
    pacienteId: string; // ID del dueño
    nombre: string;
    descripcion?: string;
    versiones: { [key: string]: VersionPlan };
}

interface AlimentoBase {
    id: string;
    nombre: string;
    tipo: string;
    cantidadBase: number;
    proteina: number;
    carbohidratos: number;
    grasas: number;
}

// =========================================================================
// 3. COMPONENTE PRINCIPAL
// =========================================================================

export default function PlanesNutricionistaPage() {
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [alimentosMap, setAlimentosMap] = useState<Map<string, AlimentoBase>>(new Map());
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Estados de selección
    const [planActivoId, setPlanActivoId] = useState<string>('');
    const [versionSeleccionada, setVersionSeleccionada] = useState<{ [planId: string]: string }>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                const [dataPlanes, dataAlimentos] = await Promise.all([
                    api.getAllPlanes(),
                    api.getAlimentos()
                ]);

                // Procesar Alimentos
                const map = new Map<string, AlimentoBase>();
                if (Array.isArray(dataAlimentos)) {
                    dataAlimentos.forEach((a: any) => {
                        map.set(a.id, {
                            id: a.id,
                            nombre: a.nombre || a.id,
                            tipo: a.tipo || 'General',
                            cantidadBase: parseNumber(a.cantidadBase) || 100,
                            proteina: parseNumber(a.proteina),
                            carbohidratos: parseNumber(a.carbohidratos),
                            grasas: parseNumber(a.grasas)
                        });
                    });
                }
                setAlimentosMap(map);

                // Procesar Planes
                if (Array.isArray(dataPlanes) && dataPlanes.length > 0) {
                    setPlanes(dataPlanes);
                    setPlanActivoId(dataPlanes[0].id);

                    const selecciones: any = {};
                    dataPlanes.forEach((p: Plan) => {
                        const keys = Object.keys(p.versiones || {});
                        const vKey = keys.find(k => k.toLowerCase().includes('volumen')) ||
                            keys.find(k => k.toLowerCase().includes('recomp')) ||
                            keys[0];
                        if (vKey) selecciones[p.id] = vKey;
                    });
                    setVersionSeleccionada(selecciones);
                }

            } catch (error) {
                console.error("Error cargando dashboard nutricionista:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // --- ACCIONES ---

    // 1. MODIFICADO: Recibe el pacienteId para saber a quién borrarle el plan
    const handleDeletePlan = async (planId: string, pacienteId: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este plan permanentemente?")) return;

        try {
            setDeletingId(planId);

            // Llamada a la API con AMBOS parámetros
            await api.eliminarPlan(planId, pacienteId);

            // Actualizar UI
            const nuevosPlanes = planes.filter(p => p.id !== planId);
            setPlanes(nuevosPlanes);

            if (planActivoId === planId && nuevosPlanes.length > 0) {
                setPlanActivoId(nuevosPlanes[0].id);
            } else if (nuevosPlanes.length === 0) {
                setPlanActivoId('');
            }

        } catch (error: any) {
            alert(error.message || "Error al eliminar plan");
        } finally {
            setDeletingId(null);
        }
    };

    // --- CÁLCULO EN VIVO ---
    const calcularItem = (ref: string, cantidadSolicitada: string) => {
        const alimento = alimentosMap.get(ref);
        if (!alimento) return null;

        const cantNum = parseCantidad(cantidadSolicitada);
        const factor = cantNum / (alimento.cantidadBase || 100);

        const p = alimento.proteina * factor;
        const c = alimento.carbohidratos * factor;
        const g = alimento.grasas * factor;
        const k = (p * 4) + (c * 4) + (g * 9);

        return { p, c, g, k, nombreReal: alimento.nombre, tipo: alimento.tipo };
    };

    // --- RENDERIZADO ---
    const planActual = planes.find(p => p.id === planActivoId);
    const versionKey = planActual ? (versionSeleccionada[planActual.id] || Object.keys(planActual.versiones)[0]) : null;
    const versionData = (planActual && versionKey) ? planActual.versiones[versionKey] : null;
    const totalesOficiales = versionData?.totales_diarios || versionData?.macros_total;

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando gestión global...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Planes Maestros</h1>
                        <p className="text-gray-500 text-sm">Gestión global de asignaciones</p>
                    </div>

                    <button
                        onClick={() => window.location.href = "/plancreator"}
                        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-md hover:bg-green-700 transition flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Asignar Nuevo Plan
                    </button>
                </div>

                {/* Tabs */}
                {planes.length > 0 ? (
                    <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                        {planes.map(plan => (
                            <button
                                key={plan.id}
                                onClick={() => setPlanActivoId(plan.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                                    planActivoId === plan.id
                                        ? 'bg-green-600 text-white border-green-600 shadow-md'
                                        : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'
                                }`}
                            >
                                {plan.nombre}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
                        <p className="text-gray-500 mb-4">No hay planes activos en el sistema.</p>
                    </div>
                )}

                {/* Detalle */}
                {planActual && versionData && (
                    <div className="space-y-6 animate-in fade-in">

                        {/* Encabezado Plan */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start gap-6">
                            <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold text-gray-900">{planActual.nombre}</h2>

                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <UserIcon className="w-3 h-3 mr-1" />
                                        {planActual.pacienteId}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm">{planActual.descripcion}</p>

                                <div className="flex gap-2 pt-2">
                                    {Object.keys(planActual.versiones).map(vKey => (
                                        <button
                                            key={vKey}
                                            onClick={() => setVersionSeleccionada(prev => ({ ...prev, [planActual.id]: vKey }))}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all border ${
                                                versionKey === vKey
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            {planActual.versiones[vKey].tipo}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 2. MODIFICADO: Botón pasa el ID del paciente */}
                            <button
                                onClick={() => handleDeletePlan(planActual.id, planActual.pacienteId)}
                                disabled={deletingId === planActual.id}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-colors text-sm font-semibold"
                            >
                                {deletingId === planActual.id ? (
                                    <span>Eliminando...</span>
                                ) : (
                                    <>
                                        <TrashIcon className="w-5 h-5" />
                                        Eliminar Plan
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Totales */}
                        {totalesOficiales && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <MacroCard label="Calorías" value={totalesOficiales.kcal} unit="kcal" color="text-green-700" bg="bg-green-50" />
                                <MacroCard label="Proteínas" value={totalesOficiales.proteinas} unit="g" color="text-blue-700" bg="bg-blue-50" />
                                <MacroCard label="Carbos" value={totalesOficiales.carbohidratos} unit="g" color="text-orange-700" bg="bg-orange-50" />
                                <MacroCard label="Grasas" value={totalesOficiales.grasas} unit="g" color="text-yellow-700" bg="bg-yellow-50" />
                            </div>
                        )}

                        {/* Notas */}
                        {versionData.notas_tecnicas && versionData.notas_tecnicas.length > 0 && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                                <h3 className="text-amber-800 font-bold text-sm uppercase mb-3 flex items-center gap-2">
                                    <ExclamationCircleIcon className="w-5 h-5" />
                                    Notas Técnicas
                                </h3>
                                <ul className="space-y-2">
                                    {versionData.notas_tecnicas.map((nota, i) => (
                                        <li key={i} className="text-amber-900 text-sm flex items-start">
                                            <span className="mr-2">•</span> {nota}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Comidas */}
                        <div className="space-y-6">
                            {versionData.comidas.map((comida, idx) => (
                                <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-800">{comida.nombre}</h3>
                                        {comida.macros && (
                                            <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                                {Math.round(comida.macros.kcal)} kcal
                                            </span>
                                        )}
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold">Alimento</th>
                                                <th className="px-6 py-3 font-semibold text-right">Porción</th>
                                                <th className="px-2 py-3 text-center text-blue-600 font-bold">P</th>
                                                <th className="px-2 py-3 text-center text-orange-600 font-bold">C</th>
                                                <th className="px-2 py-3 text-center text-yellow-600 font-bold">G</th>
                                                <th className="px-2 py-3 text-center text-green-600 font-bold">Kcal</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                            {comida.alimentos.map((item, aIdx) => {
                                                const calculo = calcularItem(item.refAlimento, item.cantidad);

                                                if (!calculo) return (
                                                    <tr key={aIdx} className="bg-red-50">
                                                        <td className="px-6 py-4 text-red-600 font-medium flex gap-2 items-center">
                                                            <ExclamationCircleIcon className="w-4 h-4" />
                                                            {item.refAlimento} (No encontrado)
                                                        </td>
                                                        <td className="px-6 py-4 text-right">{item.cantidad}</td>
                                                        <td colSpan={4} className="text-center text-gray-400">--</td>
                                                    </tr>
                                                );

                                                return (
                                                    <tr key={aIdx} className="hover:bg-gray-50/50">
                                                        <td className="px-6 py-3">
                                                            <div className="font-medium text-gray-900">{calculo.nombreReal}</div>
                                                            <div className="text-xs text-gray-400">{calculo.tipo}</div>
                                                        </td>
                                                        <td className="px-6 py-3 text-right font-mono text-gray-600">
                                                            {item.cantidad}
                                                        </td>
                                                        <td className="px-2 py-3 text-center text-blue-700 bg-blue-50/30 font-medium">{Math.round(calculo.p)}</td>
                                                        <td className="px-2 py-3 text-center text-orange-700 bg-orange-50/30 font-medium">{Math.round(calculo.c)}</td>
                                                        <td className="px-2 py-3 text-center text-yellow-700 bg-yellow-50/30 font-medium">{Math.round(calculo.g)}</td>
                                                        <td className="px-2 py-3 text-center text-green-700 bg-green-50/30 font-bold">{Math.round(calculo.k)}</td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const MacroCard = ({ label, value, unit, color, bg }: any) => (
    <div className={`p-4 rounded-xl ${bg} flex flex-col items-center justify-center text-center shadow-sm border border-transparent hover:border-opacity-50 hover:border-gray-300 transition`}>
        <span className={`text-xs font-bold uppercase opacity-70 mb-1 ${color}`}>{label}</span>
        <span className={`text-2xl font-extrabold ${color}`}>
            {Math.round(value)}{unit}
        </span>
    </div>
);