'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';

export default function RegistroPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        nombre: '',
        email: '',
        password: '',
        confirmPassword: '',
        // Nuevos campos
        peso: '',
        altura: '',
        objetivo: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (form.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            // 1. Crear usuario en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
            const user = userCredential.user;

            // 2. Preparar datos completos para el Backend
            const payload = {
                uid: user.uid,
                email: user.email,
                nombre: form.nombre,
                tipo: 2, // Paciente
                perfil_nutricional: {
                    // Convertimos a números lo que corresponda
                    altura: parseFloat(form.altura) || 0,
                    peso: parseFloat(form.peso) || 0,
                    objetivo: form.objetivo || "Sin definir",
                    alergias: [], // Podrías agregar inputs para esto después
                    restricciones: []
                }
            };

            // 3. Guardar en Base de Datos
            await api.registrarUsuario(payload);

            alert('¡Cuenta creada con éxito!');
            router.push('/');

        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Este correo ya está registrado.');
            } else {
                setError(err.message || 'Error al registrar usuario.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
            <div className="max-w-lg w-full bg-white p-8 rounded-xl shadow-md border border-green-100">
                <h2 className="text-3xl font-bold text-center text-green-700 mb-2">Crear Cuenta</h2>
                <p className="text-center text-gray-500 mb-6 text-sm">Comienza tu viaje hacia una vida saludable</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Datos Personales */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input
                            name="nombre"
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="Ej: Juan Pérez"
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                            <input
                                name="peso"
                                type="number"
                                step="0.1"
                                required
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="Ej: 70.5"
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Altura (cm)</label>
                            <input
                                name="altura"
                                type="number"
                                required
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="Ej: 175"
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo Principal</label>
                        <input
                            name="objetivo"
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="Ej: Ganar masa muscular, Perder peso..."
                            onChange={handleChange}
                        />
                    </div>

                    {/* Credenciales */}
                    <div className="pt-2 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="juan@ejemplo.com"
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <input
                                name="password"
                                type="password"
                                required
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="******"
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="******"
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg text-white font-bold shadow-md transition mt-4 ${
                            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
                        }`}
                    >
                        {loading ? 'Creando cuenta...' : 'Registrarse'}
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-600 text-sm">
                    ¿Ya tienes cuenta?{' '}
                    <a href="/Login" className="text-green-600 font-bold hover:underline">
                        Inicia sesión aquí
                    </a>
                </p>
            </div>
        </div>
    );
}