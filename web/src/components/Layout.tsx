'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
    ArrowRightOnRectangleIcon,
    UserCircleIcon,
    HeartIcon
} from '@heroicons/react/24/solid';

const Layout = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/Login');
        } catch (error) {
            console.error("Error al cerrar sesión", error);
        }
    };

    const isAuthPage = pathname === '/Login' || pathname === '/registro';

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">

                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-2xl font-black text-green-600 tracking-tighter">
                                Nutri<span className="text-gray-800">App</span>
                            </span>
                        </Link>

                        {/* Menú Derecho */}
                        <div className="flex items-center gap-4">
                            {!loading && (
                                <>
                                    {user ? (
                                        // LOGUEADO: Barra de herramientas de usuario
                                        <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 p-1 pl-4 gap-3 shadow-sm">

                                            {/* Email del usuario */}
                                            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                                                <UserCircleIcon className="w-5 h-5 text-gray-400" />
                                                <span className="truncate max-w-[150px] font-medium">{user.email}</span>
                                            </div>

                                            {/* Separador */}
                                            <div className="h-5 w-px bg-gray-300 hidden md:block"></div>

                                            {/* Acciones */}
                                            <div className="flex items-center gap-1">
                                                {/* Botón Farmacias (Corazón) */}
                                                <Link href="/farmacias" title="Farmacias de Turno">
                                                    <button className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all duration-300 hover:shadow-md group">
                                                        {/* Agregamos 'animate-pulse' aquí para el efecto de latido continuo */}
                                                        <HeartIcon className="w-6 h-6 animate-pulse" />
                                                    </button>
                                                </Link>

                                                {/* Botón Salir */}
                                                <button
                                                    onClick={handleLogout}
                                                    title="Cerrar Sesión"
                                                    className="p-2 text-gray-400 hover:bg-white hover:text-red-600 rounded-full transition hover:shadow-md"
                                                >
                                                    <ArrowRightOnRectangleIcon className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // NO LOGUEADO
                                        <div className="flex items-center gap-3">
                                            {/* Aun sin loguear, mostramos el acceso a Farmacias */}
                                            <Link href="/farmacias" className="flex items-center gap-1 text-red-500 font-bold hover:bg-red-50 px-3 py-2 rounded-lg transition text-sm">
                                                <HeartIcon className="w-5 h-5" />
                                                <span className="hidden sm:inline">Farmacias</span>
                                            </Link>

                                            <div className="h-6 w-px bg-gray-200"></div>

                                            <Link href="/Login">
                                                <button className="text-gray-600 hover:text-green-600 font-bold text-sm transition px-2">
                                                    Ingresar
                                                </button>
                                            </Link>
                                            <Link href="/registro">
                                                <button className="bg-green-600 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-green-700 transition shadow-md hover:shadow-lg">
                                                    Registrarse
                                                </button>
                                            </Link>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto py-6 px-4 text-center text-gray-400 text-sm">
                    © {new Date().getFullYear()} NutriApp. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    );
};

export default Layout;