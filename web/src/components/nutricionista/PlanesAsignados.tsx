'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import TableAlimentos from '../TableAlimentos';

interface PlanAlimento {
    refAlimento: string;
    cantidad: string;
    macros?: {
        proteinas: number;
        carbohidratos: number;
        grasas: number;
        kcal?: number;
    };
}

interface Comida {
    nombre: string;
    descripcion?: string;
    alimentos: PlanAlimento[];
}

interface Plan {
    id: string;
    nombre: string;
    tipo: string;
    calorias: number;
    descripcion?: string;
    comidas?: Comida[];
}

interface PlanesAsignadosProps {
    pacienteId: string;
}

export default function PlanesAsignados({ pacienteId }: PlanesAsignadosProps) {
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlanes = async () => {
            try {
                const q = query(collection(db, 'planes'), where('pacienteId', '==', pacienteId));
                const snapshot = await getDocs(q);
                const planesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Plan[];
                setPlanes(planesData);
            } catch (error) {
                console.error('Error obteniendo planes asignados:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlanes();
    }, [pacienteId]);

    if (loading) return <p className="text-gray-500">Cargando planes asignados...</p>;
    if (!planes.length) return <p className="text-gray-500">No hay planes asignados a este paciente.</p>;

    return (
        <div className="flex flex-col gap-6">
            {planes.map(plan => (
                <div key={plan.id} className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-xl font-bold text-green-700 mb-2">{plan.nombre}</h3>
                    <p className="text-gray-600 mb-4">Tipo: {plan.tipo} | Calorías: {plan.calorias}</p>

                    {plan.comidas && plan.comidas.length > 0 ? (
                        plan.comidas.map((comida, index) => (
                            <div key={index} className="mb-4">
                                <h4 className="font-semibold text-gray-700 mb-2">{comida.nombre}</h4>
                                <TableAlimentos alimentos={comida.alimentos} />
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 text-sm">Este plan aún no tiene comidas asignadas.</p>
                    )}
                </div>
            ))}
        </div>
    );
}