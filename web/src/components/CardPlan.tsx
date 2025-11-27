import React from 'react';

interface DistribucionMacros {
    proteina: number;
    carbohidratos: number;
    grasas: number;
}

interface TotalesDiarios {
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    kcal: number;
}

interface CardPlanProps {
    nombre: string;
    tipo: string;
    calorias: number;
    descripcion?: string;
    distribucionMacros?: DistribucionMacros;
    totalesDiarios?: TotalesDiarios;
}

export default function CardPlan({
                                     nombre,
                                     tipo,
                                     calorias,
                                     descripcion,
                                     distribucionMacros,
                                     totalesDiarios
                                 }: CardPlanProps) {
    return (
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">{nombre}</h2>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                        tipo.toLowerCase().includes('volumen') ? 'bg-green-600' : 'bg-cyan-600'
                    }`}>
                        {tipo}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-indigo-400">{Math.round(calorias)}</div>
                    <div className="text-gray-400 text-sm">kcal totales</div>
                </div>
            </div>

            {descripcion && (
                <p className="text-gray-300 mb-4 text-sm">{descripcion}</p>
            )}

            {/* Distribución de Macros */}
            {distribucionMacros && (
                <div className="mb-4">
                    <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Distribución</h4>
                    <div className="flex gap-6 text-sm">
                        <div className="text-green-400">
                            <span className="font-bold block text-lg">{Math.round(distribucionMacros.proteina)}%</span> Proteína
                        </div>
                        <div className="text-yellow-400">
                            <span className="font-bold block text-lg">{Math.round(distribucionMacros.carbohidratos)}%</span> Carbohidratos
                        </div>
                        <div className="text-red-400">
                            <span className="font-bold block text-lg">{Math.round(distribucionMacros.grasas)}%</span> Grasas
                        </div>
                    </div>
                </div>
            )}

            {/* Totales Diarios */}
            {totalesDiarios && (
                <div className="border-t border-gray-700 pt-4 mt-4">
                    <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Totales Diarios (g)</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-green-400 font-bold text-xl">{Math.round(totalesDiarios.proteinas)}g</div>
                            <div className="text-gray-500 text-xs">Proteínas</div>
                        </div>
                        <div>
                            <div className="text-yellow-400 font-bold text-xl">{Math.round(totalesDiarios.carbohidratos)}g</div>
                            <div className="text-gray-500 text-xs">Carbos</div>
                        </div>
                        <div>
                            <div className="text-red-400 font-bold text-xl">{Math.round(totalesDiarios.grasas)}g</div>
                            <div className="text-gray-500 text-xs">Grasas</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}