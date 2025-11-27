'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // <--- IMPORTANTE
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
    const router = useRouter();
    // ... (resto de tus estados: email, password, error, loading) ...
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        // ... (tu lógica de submit existente) ...
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email || !password) {
            setError('Por favor completa todos los campos');
            setLoading(false);
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
        } catch (err: any) {
            console.error("Error en login:", err);
            // Manejo de errores simplificado
            setError('Correo o contraseña incorrectos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB] px-4">
            <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-xl shadow-md border border-green-200 text-center">

                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                    <span className="text-[#059669]">Iniciar</span> Sesión
                </h1>
                <p className="text-gray-600 mb-8">
                    Accede a tu panel personalizado de NutriApp
                </p>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* ... tus inputs de email y password ... */}
                    <div className="text-left">
                        <label className="block text-gray-700 font-semibold mb-2">Correo electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-[#4ADE80] outline-none transition"
                            required
                        />
                    </div>

                    <div className="text-left">
                        <label className="block text-gray-700 font-semibold mb-2">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-[#4ADE80] outline-none transition"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-left">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-gradient-to-r from-[#4ADE80] to-[#059669] text-white font-bold py-2.5 px-7 rounded-full text-sm shadow-md transition transform ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                    >
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>

                {/* --- NUEVO: ENLACE AL REGISTRO --- */}
                <div className="mt-6 text-sm text-gray-600">
                    ¿Aún no tienes cuenta?{' '}
                    <Link href="/registro" className="text-[#059669] font-bold hover:underline">
                        Regístrate aquí
                    </Link>
                </div>

            </div>
        </div>
    );
}