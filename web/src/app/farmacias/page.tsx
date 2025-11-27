'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import {
    MapPinIcon,
    PhoneIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    ExclamationTriangleIcon,
    ChevronDownIcon
} from '@heroicons/react/24/solid';

// --- INTERFACES ---
interface Farmacia {
    local_nombre: string;
    local_direccion: string;
    local_telefono: string;
    local_lat: string;
    local_lng: string;
    fk_region: string;
    fk_comuna: string;
    comuna_nombre: string;
    funcionamiento_hora_apertura: string;
    funcionamiento_hora_cierre: string;
}

export default function FarmaciasPage() {
    const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // Estado del buscador y sugerencias
    const [busqueda, setBusqueda] = useState("");
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

    // Referencia para detectar clics fuera del buscador
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchFarmacias = async () => {
            try {
                // URL directa al MINSAL
                const url = 'https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php';
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error('No se pudo conectar con el servidor del MINSAL.');
                }

                let textData = await response.text();
                textData = textData.trim();
                // Limpiar BOM
                if (textData.charCodeAt(0) === 0xFEFF) {
                    textData = textData.slice(1);
                }

                try {
                    const data = JSON.parse(textData);
                    if (Array.isArray(data)) {
                        setFarmacias(data);
                    } else {
                        setFarmacias([]);
                    }
                } catch (e) {
                    console.error("Error parseando JSON:", e);
                    setErrorMsg("Datos recibidos con formato incorrecto.");
                }

            } catch (error: any) {
                console.error("Error fetching farmacias:", error);
                setErrorMsg("El servicio de turnos no está respondiendo.");
            } finally {
                setLoading(false);
            }
        };

        fetchFarmacias();

        // Cerrar sugerencias al hacer clic fuera
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setMostrarSugerencias(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 1. LISTA DE COMUNAS (Para autocompletado)
    const listaComunas = useMemo(() => {
        const comunasSet = new Set<string>();
        farmacias.forEach(f => {
            if (f.comuna_nombre) {
                comunasSet.add(f.comuna_nombre.trim());
            }
        });
        return Array.from(comunasSet).sort();
    }, [farmacias]);

    // 2. SUGERENCIAS FILTRADAS (Mientras escribes)
    const sugerenciasVisibles = useMemo(() => {
        if (!busqueda) return [];
        const termino = busqueda.toLowerCase();
        return listaComunas.filter(c => c.toLowerCase().includes(termino)).slice(0, 5);
    }, [listaComunas, busqueda]);

    // 3. FILTRADO FINAL DE FARMACIAS
    const farmaciasFiltradas = useMemo(() => {
        if (!busqueda) return farmacias;

        const termino = busqueda.toLowerCase();
        return farmacias.filter(f =>
            f.comuna_nombre.toLowerCase().includes(termino) ||
            f.local_nombre.toLowerCase().includes(termino)
        );
    }, [farmacias, busqueda]);

    // 4. AGRUPACIÓN POR COMUNA
    const farmaciasPorComuna = useMemo(() => {
        const grupos: { [key: string]: Farmacia[] } = {};
        farmaciasFiltradas.forEach(f => {
            if (!grupos[f.comuna_nombre]) {
                grupos[f.comuna_nombre] = [];
            }
            grupos[f.comuna_nombre].push(f);
        });
        return grupos;
    }, [farmaciasFiltradas]);

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto">

                {/* --- HEADER --- */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 flex items-center justify-center gap-3 tracking-tight">
                        <span className="text-5xl drop-shadow-sm">🏥</span>
                        Farmacias de <span className="text-red-600">Turno</span>
                    </h1>
                    <p className="text-gray-500 mt-3 text-lg">
                        Encuentra la farmacia abierta más cercana en tiempo real
                    </p>
                </div>

                {/* --- BUSCADOR PERSONALIZADO (CUSTOM AUTOCOMPLETE) --- */}
                <div className="max-w-2xl mx-auto mb-12 relative z-50" ref={wrapperRef}>
                    <div className="relative group">
                        {/* Input Principal */}
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                        </div>

                        <input
                            type="text"
                            placeholder="Busca tu comuna (ej: Santiago, Viña...)"
                            value={busqueda}
                            onChange={(e) => {
                                setBusqueda(e.target.value);
                                setMostrarSugerencias(true);
                            }}
                            onFocus={() => setMostrarSugerencias(true)}
                            className="block w-full pl-14 pr-12 py-4 bg-white border border-gray-200 rounded-2xl leading-5 text-gray-900 placeholder-gray-400
                                       focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-red-400
                                       transition-all shadow-lg shadow-gray-200/50 text-lg font-medium"
                            autoComplete="off"
                        />

                        {/* Flecha indicadora */}
                        <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                            <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${mostrarSugerencias ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {/* MENU DESPLEGABLE (Sugerencias) */}
                    {mostrarSugerencias && sugerenciasVisibles.length > 0 && (
                        <ul className="absolute w-full bg-white mt-2 rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto py-2 animate-in fade-in zoom-in-95 duration-200">
                            {sugerenciasVisibles.map((comuna, idx) => (
                                <li
                                    key={idx}
                                    onClick={() => {
                                        setBusqueda(comuna);
                                        setMostrarSugerencias(false);
                                    }}
                                    className="px-6 py-3 hover:bg-red-50 cursor-pointer text-gray-700 hover:text-red-700 font-medium flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                                >
                                    <MapPinIcon className="w-4 h-4 text-red-300" />
                                    {comuna}
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Contador de resultados */}
                    <div className="mt-4 text-center">
                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${farmaciasFiltradas.length > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                            {farmaciasFiltradas.length} {farmaciasFiltradas.length === 1 ? 'Farmacia Disponible' : 'Farmacias Disponibles'}
                        </span>
                    </div>
                </div>

                {/* --- CONTENIDO --- */}
                {loading ? (
                    <div className="text-center py-24 text-gray-400 flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-red-500 mb-4"></div>
                        <p className="text-lg font-medium">Conectando con MINSAL...</p>
                    </div>
                ) : errorMsg ? (
                    <div className="max-w-xl mx-auto bg-white border border-red-100 rounded-2xl p-8 text-center shadow-sm">
                        <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <h3 className="font-bold text-xl text-gray-800 mb-2">Sin Conexión</h3>
                        <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm shadow-md hover:shadow-lg"
                        >
                            Reintentar Conexión
                        </button>
                    </div>
                ) : (
                    // --- LISTA AGRUPADA ---
                    <div className="space-y-16 pb-20">
                        {Object.keys(farmaciasPorComuna).sort().map((comuna) => (
                            <div key={comuna} className="animate-in slide-in-from-bottom-4 duration-700">

                                {/* Título de Comuna */}
                                <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800 mb-8 pb-3 border-b border-gray-200">
                                    <div className="bg-red-100 p-2.5 rounded-xl text-red-600 shadow-sm">
                                        <MapPinIcon className="w-6 h-6" />
                                    </div>
                                    {comuna}
                                </h2>

                                {/* Grid de Tarjetas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {farmaciasPorComuna[comuna].map((f, idx) => (
                                        <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-red-50 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">

                                            {/* Decoración Roja (Esquina) */}
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 opacity-70"></div>

                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-5">
                                                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-red-600 transition-colors line-clamp-1 pr-2 leading-tight">
                                                        {f.local_nombre}
                                                    </h3>
                                                    {/* Badge de Turno */}
                                                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-sm flex-shrink-0">
                                                        TURNO
                                                    </span>
                                                </div>

                                                <div className="space-y-3 text-sm text-gray-600">
                                                    {/* Dirección */}
                                                    <div className="flex items-start gap-3">
                                                        <MapPinIcon className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors flex-shrink-0 mt-0.5" />
                                                        <span className="leading-snug font-medium text-gray-700">{f.local_direccion}</span>
                                                    </div>

                                                    {/* Teléfono */}
                                                    <div className="flex items-center gap-3">
                                                        <PhoneIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                                                        <span className="font-mono text-gray-600 select-all">{f.local_telefono}</span>
                                                    </div>

                                                    {/* Horario (Destacado) */}
                                                    <div className="pt-2">
                                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 w-full group-hover:border-red-100 group-hover:bg-red-50/50 transition-colors">
                                                            <ClockIcon className="w-4 h-4 text-gray-500 group-hover:text-red-500 flex-shrink-0" />
                                                            <span className="font-bold text-gray-700 text-xs">
                                                                {f.funcionamiento_hora_apertura} - {f.funcionamiento_hora_cierre} hrs
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {Object.keys(farmaciasPorComuna).length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                                    <MagnifyingGlassIcon className="w-10 h-10 text-gray-300" />
                                </div>
                                <p className="text-gray-900 text-xl font-bold mb-2">No encontramos resultados</p>
                                <p className="text-gray-500">Prueba escribiendo el nombre de tu comuna nuevamente.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}