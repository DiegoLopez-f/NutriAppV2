'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export interface Alimento {
    id: string;
    nombre: string;
    proteina: number;
    grasas: number;
    carbohidratos: number;
    calorias: number;
}

export interface PlanItem extends Alimento {
    cantidad: number;
    unidad: string;
    idLocal: string;
    idOriginal: string;
}

export type Comida = 'Desayuno' | 'Colacion' | 'Almuerzo' | 'Cena';

export const INITIAL_PLAN_ITEMS: Record<Comida, PlanItem[]> = {
    Desayuno: [],
    Colacion: [],
    Almuerzo: [],
    Cena: [],
};

// Parser numérico seguro
const parseNumber = (value: any): number => {
    const num = parseFloat(value);
    return isNaN(num) || num === null || value === undefined ? 0 : num;
};

const calcularTotales = (planItems: Record<Comida, PlanItem[]>) => {
    const todosLosItems = Object.values(planItems).flat();
    return todosLosItems.reduce(
        (acc, item) => {
            // Backend asume base 100g
            const factor = item.cantidad / 100;
            acc.kcal += (item.calorias || 0) * factor;
            acc.proteinas += (item.proteina || 0) * factor;
            acc.grasas += (item.grasas || 0) * factor;
            acc.carbohidratos += (item.carbohidratos || 0) * factor;
            return acc;
        },
        { kcal: 0, proteinas: 0, grasas: 0, carbohidratos: 0 }
    );
};

const PlanCreator: React.FC = () => {
    const [alimentosMaestros, setAlimentosMaestros] = useState<Alimento[]>([]);

    // Datos del Plan
    const [pacienteId, setPacienteId] = useState('');
    const [nombrePlan, setNombrePlan] = useState('');
    const [tipoPlan, setTipoPlan] = useState<'Volumen' | 'Recomposición'>('Volumen');
    const [objetivo, setObjetivo] = useState('');

    // Estado de items
    const [planItems, setPlanItems] = useState<Record<Comida, PlanItem[]>>(INITIAL_PLAN_ITEMS);
    const [selectedComida, setSelectedComida] = useState<Comida>('Desayuno');
    const [selectedFoodId, setSelectedFoodId] = useState('');
    const [cantidad, setCantidad] = useState(100);
    const [unidad, setUnidad] = useState('g');

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const comidas: Comida[] = ['Desayuno', 'Colacion', 'Almuerzo', 'Cena'];

    // 1. CARGAR ALIMENTOS (Con espera de Autenticación)
    useEffect(() => {
        let isMounted = true;

        const fetchAlimentos = async () => {
            try {
                // Llamada al Backend
                const data = await api.getAlimentos();

                // Procesar datos para asegurar números
                const alimentosList: Alimento[] = data.map((a: any) => {
                    const p = parseNumber(a.proteina || a.proteinas);
                    const c = parseNumber(a.carbohidratos);
                    const g = parseNumber(a.grasas);
                    // Prioridad a calorias explícitas, sino fórmula
                    const cal = parseNumber(a.calorias || a.kcal);
                    const caloriasFinal = cal > 0 ? cal : (p * 4 + c * 4 + g * 9);

                    return {
                        id: a.id,
                        nombre: a.nombre || 'Sin nombre',
                        proteina: p,
                        grasas: g,
                        carbohidratos: c,
                        calorias: caloriasFinal,
                    };
                });

                if (isMounted) {
                    setAlimentosMaestros(alimentosList);
                    setCargando(false);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setError('Error al cargar alimentos desde el servidor. Asegúrate de que el Backend esté corriendo en puerto 3000.');
                    setCargando(false);
                }
            }
        };

        // SUSCRIPCIÓN A FIREBASE AUTH
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Solo intentamos cargar cuando tenemos usuario confirmado
                fetchAlimentos();
            } else {
                // Si no hay usuario, esperamos (o redirigimos)
                console.log("Esperando autenticación...");
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFoodId || cantidad <= 0) {
            alert('Selecciona un alimento y una cantidad válida.');
            return;
        }
        const foodToAdd = alimentosMaestros.find(a => a.id === selectedFoodId);
        if (foodToAdd) {
            const newItem: PlanItem = {
                ...foodToAdd,
                cantidad,
                unidad,
                idLocal: crypto.randomUUID(),
                idOriginal: foodToAdd.id,
            };
            setPlanItems(prev => ({
                ...prev,
                [selectedComida]: [...prev[selectedComida], newItem],
            }));
            setSelectedFoodId('');
            setCantidad(100);
        }
    };

    // 2. GUARDAR PLAN (POST al Backend)
    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!pacienteId.trim()) {
            alert('Debes ingresar el ID del paciente (UID).');
            return;
        }
        if (!nombrePlan.trim() || Object.values(planItems).flat().length === 0) {
            alert('El plan debe tener un nombre y al menos un alimento.');
            return;
        }

        try {
            setGuardando(true);

            // Preparar payload para el Backend
            const comidasPayload = Object.entries(planItems)
                .filter(([_, items]) => items.length > 0)
                .map(([comidaNombre, items]) => ({
                    nombre: comidaNombre,
                    alimentos: items.map(item => ({
                        refAlimento: item.idOriginal,
                        cantidad: `${item.cantidad}${item.unidad}`
                    }))
                }));

            const payload = {
                pacienteId: pacienteId.trim(),
                nombre: nombrePlan.trim(),
                tipo: tipoPlan,
                objetivo: objetivo.trim() || `Plan de ${tipoPlan}`,
                descripcionPlan: `Creado desde Web el ${new Date().toLocaleDateString()}`,
                comidas: comidasPayload
            };

            await api.crearPlan(payload);

            alert(`¡Plan "${nombrePlan}" asignado correctamente!`);

            // Resetear formulario
            setNombrePlan('');
            setObjetivo('');
            setTipoPlan('Volumen');
            setPlanItems(INITIAL_PLAN_ITEMS);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al guardar el plan en el servidor.');
        } finally {
            setGuardando(false);
        }
    };

    const totalesActuales = useMemo(() => calcularTotales(planItems), [planItems]);
    const totalItems = Object.values(planItems).flat().length;

    if (cargando) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-500">Cargando alimentos...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-6 font-sans">
            <h1 className="text-3xl font-bold text-green-700 text-center mb-10">Asignar Plan Nutricional</h1>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-center border border-red-200">
                    {error}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
                {/* Columna Izquierda: Configuración */}
                <div className="space-y-6">

                    {/* Datos Principales */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="bg-green-100 text-green-700 w-6 h-6 flex items-center justify-center rounded-full text-sm">1</span>
                            Configuración del Plan
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID Paciente (UID)</label>
                                <input
                                    type="text"
                                    value={pacienteId}
                                    onChange={e => setPacienteId(e.target.value)}
                                    placeholder="Pega aquí el UID del usuario"
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Plan</label>
                                <input
                                    type="text"
                                    value={nombrePlan}
                                    onChange={e => setNombrePlan(e.target.value)}
                                    placeholder="Ej: Plan Semanal A"
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select
                                        value={tipoPlan}
                                        onChange={e => setTipoPlan(e.target.value as 'Volumen' | 'Recomposición')}
                                        className="w-full border border-gray-300 rounded-lg p-2 bg-white"
                                    >
                                        <option value="Volumen">Volumen</option>
                                        <option value="Recomposición">Recomposición</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
                                    <input
                                        type="text"
                                        value={objetivo}
                                        onChange={e => setObjetivo(e.target.value)}
                                        placeholder="Ej: Subir masa muscular"
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Agregar Alimentos */}
                    <form onSubmit={handleAddItem} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="bg-green-100 text-green-700 w-6 h-6 flex items-center justify-center rounded-full text-sm">2</span>
                            Selección de Alimentos
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comida</label>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    {comidas.map(c => (
                                        <button
                                            type="button"
                                            key={c}
                                            onClick={() => setSelectedComida(c)}
                                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${selectedComida === c ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Alimento</label>
                                <select
                                    value={selectedFoodId}
                                    onChange={e => setSelectedFoodId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white"
                                >
                                    <option value="">-- Buscar alimento --</option>
                                    {alimentosMaestros.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.nombre} ({Math.round(a.calorias)} kcal/100g)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                                    <input
                                        type="number"
                                        value={cantidad}
                                        onChange={e => setCantidad(parseFloat(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg p-2"
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                                    <select
                                        value={unidad}
                                        onChange={e => setUnidad(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50"
                                    >
                                        <option value="g">g</option>
                                        <option value="ml">ml</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!selectedFoodId}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-bold transition shadow-md shadow-green-200"
                            >
                                + Añadir
                            </button>
                        </div>
                    </form>
                </div>

                {/* Columna Derecha: Resumen */}
                <div className="space-y-6">

                    {/* Totales */}
                    <div className="bg-green-600 text-white p-6 rounded-2xl shadow-lg shadow-green-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Resumen Diario</h3>
                            <span className="bg-green-500 px-3 py-1 rounded-full text-xs font-semibold">{totalItems} ítems</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div>
                                <p className="text-3xl font-extrabold">{Math.round(totalesActuales.kcal)}</p>
                                <p className="text-xs uppercase opacity-80">Kcal</p>
                            </div>
                            <div>
                                <p className="text-xl font-bold">{Math.round(totalesActuales.proteinas)}g</p>
                                <p className="text-xs uppercase opacity-80">Prot</p>
                            </div>
                            <div>
                                <p className="text-xl font-bold">{Math.round(totalesActuales.carbohidratos)}g</p>
                                <p className="text-xs uppercase opacity-80">Carb</p>
                            </div>
                            <div>
                                <p className="text-xl font-bold">{Math.round(totalesActuales.grasas)}g</p>
                                <p className="text-xs uppercase opacity-80">Gras</p>
                            </div>
                        </div>
                    </div>

                    {/* Lista Visual */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 min-h-[400px]">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-700">Menú del Día</h3>
                        </div>
                        <div className="overflow-y-auto max-h-[500px] p-4 space-y-6">
                            {comidas.map(comida => (
                                <div key={comida}>
                                    <h4 className="text-sm font-bold text-green-700 uppercase mb-2 border-b border-green-100 pb-1">
                                        {comida}
                                    </h4>
                                    {planItems[comida].length === 0 ? (
                                        <p className="text-xs text-gray-400 italic pl-2">Sin alimentos</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {planItems[comida].map(item => (
                                                <li key={item.idLocal} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg group transition">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{item.nombre}</p>
                                                        <p className="text-xs text-gray-500">{item.cantidad}{item.unidad} • {Math.round((item.calorias * item.cantidad)/100)} kcal</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setPlanItems(prev => ({
                                                            ...prev,
                                                            [comida]: prev[comida].filter(i => i.idLocal !== item.idLocal),
                                                        }))}
                                                        className="text-gray-300 hover:text-red-500 transition p-1"
                                                    >
                                                        ✕
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Botón Guardar */}
                    <button
                        onClick={handleSavePlan}
                        disabled={guardando || totalItems === 0 || !pacienteId}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition transform active:scale-95 ${
                            guardando || totalItems === 0 || !pacienteId
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-green-300 hover:-translate-y-1'
                        }`}
                    >
                        {guardando ? 'Guardando...' : '💾 Guardar Plan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanCreator;