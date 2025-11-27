'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

// =========================================================================
// 1. UTILIDADES
// =========================================================================

const parseNumber = (value: any): number => {
    const num = parseFloat(value);
    return isNaN(num) || num === null || value === undefined ? 0 : num;
};

// Limpia "150 g" -> 150
const parseCantidad = (cantidadStr: string): number => {
    return parseNumber(String(cantidadStr).replace(/[^0-9.]/g, ''));
};

// =========================================================================
// 2. INTERFACES (Ajustadas a tu JSON real)
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
    macros?: Macros; // Usaremos ESTO para los totales, ignorando la suma de alimentos
}

interface VersionPlan {
    tipo: string;
    calorias: number;
    objetivo?: string;
    comidas: Comida[];
    totales_diarios?: Macros;
    notas_tecnicas?: string[];
}

interface Plan {
    id: string;
    nombre: string;
    descripcion?: string;
    versiones: { [key: string]: VersionPlan };
    asignadoA?: string;
}

interface AlimentoBase {
    id: string;
    nombre: string;
    tipo: string;
    cantidadBase: number;
    proteina: number;
    carbohidratos: number;
    grasas: number;
    // Sin calorias explícitas en JSON, se calculan
}

// =========================================================================
// 3. COMPONENTE
// =========================================================================

export default function PlanesPage() {
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [alimentosMap, setAlimentosMap] = useState<Map<string, AlimentoBase>>(new Map());
    const [loading, setLoading] = useState(true);

    // Estados de selección
    const [planActivoId, setPlanActivoId] = useState<string>('');
    const [versionSeleccionada, setVersionSeleccionada] = useState<{ [planId: string]: string }>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                const [dataPlanes, dataAlimentos] = await Promise.all([
                    api.getMisPlanes(),
                    api.getAlimentos()
                ]);

                // PROCESAR ALIMENTOS
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

                // PROCESAR PLANES
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
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // --- CÁLCULO INDIVIDUAL (Solo para mostrar detalle en tabla) ---
    const calcularItem = (ref: string, cantidadSolicitada: string) => {
        const alimento = alimentosMap.get(ref);
        if (!alimento) return null;

        const cantNum = parseCantidad(cantidadSolicitada);
        // Fórmula usando cantidadBase correcta del JSON
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

    // USAMOS LOS VALORES DEL JSON (No recalculamos totales)
    const totalesOficiales = versionData?.totales_diarios;

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando...</div>;

    if (!planActual || !versionData) return <div className="p-8 text-center text-gray-500">No hay planes.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 bg-white rounded-full shadow-sm hover:shadow text-gray-600 transition">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{planActual.nombre}</h1>
                            <p className="text-gray-500 text-sm">{planActual.descripcion}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    {planes.length > 1 && (
                        <div className="flex bg-gray-200 p-1 rounded-lg">
                            {planes.map(plan => (
                                <button
                                    key={plan.id}
                                    onClick={() => setPlanActivoId(plan.id)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                                        planActivoId === plan.id ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600'
                                    }`}
                                >
                                    {plan.nombre}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Versión y Objetivo */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-wide bg-green-50 px-2 py-1 rounded">
                            Objetivo
                        </span>
                        <p className="text-lg font-medium text-gray-800 mt-2">
                            {versionData.objetivo || versionData.tipo}
                        </p>
                    </div>

                    <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl">
                        {Object.keys(planActual.versiones).map(vKey => (
                            <button
                                key={vKey}
                                onClick={() => setVersionSeleccionada(prev => ({ ...prev, [planActual.id]: vKey }))}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                                    versionKey === vKey
                                        ? 'bg-white text-green-600 shadow-md'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {planActual.versiones[vKey].tipo}
                            </button>
                        ))}
                    </div>
                </div>

                {/* TOTALES (Usando datos fijos del JSON) */}
                {totalesOficiales ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MacroCard label="Calorías" value={totalesOficiales.kcal} unit="kcal" color="text-green-700" bg="bg-green-50" />
                        <MacroCard label="Proteínas" value={totalesOficiales.proteinas} unit="g" color="text-blue-700" bg="bg-blue-50" />
                        <MacroCard label="Carbohidratos" value={totalesOficiales.carbohidratos} unit="g" color="text-orange-700" bg="bg-orange-50" />
                        <MacroCard label="Grasas" value={totalesOficiales.grasas} unit="g" color="text-yellow-700" bg="bg-yellow-50" />
                    </div>
                ) : (
                    <div className="text-center p-4 bg-red-50 text-red-600 rounded-lg">Error: No hay totales en el plan.</div>
                )}

                {/* Comidas */}
                <div className="space-y-8">
                    {versionData.comidas.map((comida, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                            {/* Header Comida (Usando datos fijos del JSON) */}
                            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-xl text-gray-800">{comida.nombre}</h3>
                                    {comida.descripcion && <p className="text-xs text-gray-500 mt-1">{comida.descripcion}</p>}
                                </div>
                                {comida.macros && (
                                    <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-center">
                                        <span className="block text-[10px] uppercase font-bold text-gray-400">Total</span>
                                        <span className="font-bold text-gray-800">{Math.round(comida.macros.kcal)} kcal</span>
                                    </div>
                                )}
                            </div>

                            {/* Tabla Alimentos */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
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
                                                    {item.refAlimento}
                                                </td>
                                                <td className="px-6 py-4 text-right">{item.cantidad}</td>
                                                <td colSpan={4} className="text-center text-gray-400">--</td>
                                            </tr>
                                        );

                                        return (
                                            <tr key={aIdx} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{calculo.nombreReal}</div>
                                                    <div className="text-xs text-gray-400">{calculo.tipo}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-600">
                                                    {item.cantidad}
                                                </td>
                                                <td className="px-2 py-4 text-center text-blue-700 bg-blue-50/30">
                                                    {Math.round(calculo.p)}
                                                </td>
                                                <td className="px-2 py-4 text-center text-orange-700 bg-orange-50/30">
                                                    {Math.round(calculo.c)}
                                                </td>
                                                <td className="px-2 py-4 text-center text-yellow-700 bg-yellow-50/30">
                                                    {Math.round(calculo.g)}
                                                </td>
                                                <td className="px-2 py-4 text-center text-green-700 bg-green-50/30 font-bold">
                                                    {Math.round(calculo.k)}
                                                </td>
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
        </div>
    );
}

const MacroCard = ({ label, value, unit, color, bg }: any) => (
    <div className={`p-4 rounded-xl ${bg} flex flex-col items-center justify-center text-center`}>
        <span className={`text-xs font-bold uppercase opacity-70 mb-1 ${color}`}>{label}</span>
        <span className={`text-2xl font-extrabold ${color}`}>
            {Math.round(value)}{unit}
        </span>
    </div>
);