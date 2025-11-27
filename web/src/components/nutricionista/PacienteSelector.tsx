'use client';

import React, { useEffect, useState } from 'react';
import ButtonRole from '../ButtonRole';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface Paciente {
    id: string;
    nombre: string;
}

interface PacienteSelectorProps {
    onSelect: (pacienteId: string) => void;
}

export default function PacienteSelector({ onSelect }: PacienteSelectorProps) {
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPacientes = async () => {
            try {
                const q = query(collection(db, 'usuario'), where('tipo', '==', 2));
                const snapshot = await getDocs(q);
                const pacientesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    nombre: doc.data().nombre,
                })) as Paciente[];
                setPacientes(pacientesData);
            } catch (error) {
                console.error('Error obteniendo pacientes:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPacientes();
    }, []);

    if (loading) return <p className="text-gray-500">Cargando pacientes...</p>;
    if (!pacientes.length) return <p className="text-gray-500">No hay pacientes registrados.</p>;

    return (
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col gap-2 w-full max-w-xs">
            {pacientes.map((paciente) => (
                <ButtonRole
                    key={paciente.id}
                    onClick={() => onSelect(paciente.id)}
                >
                    {paciente.nombre}
                </ButtonRole>
            ))}
        </div>
    );
}