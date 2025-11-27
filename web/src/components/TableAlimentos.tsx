import React from 'react';

// Interfaz para los alimentos en el plan de dieta (la lista 'alimentos')
interface AlimentoEnPlan {
    refAlimento: string; // ID del alimento para buscar en el catálogo (debería coincidir con 'id')
    cantidad: string;    // Ejemplo: "120 g", "1 unidad"
}

// Interfaz para los alimentos de la base de datos (la lista 'alimentosBase')
interface AlimentoBase {
    id: string;
    nombre: string;
    tipo: string;
    cantidadBase: number; // Porción de referencia (ej: 100)
    unidad: string;       // Unidad de la porción (ej: "g")
    proteina: number;     // Nota: minúscula
    carbohidratos: number; // Nota: minúscula
    grasas: number;        // Nota: minúscula
    equivalentes?: string[];
}

interface TableAlimentosProps {
    alimentos: AlimentoEnPlan[]; // Los alimentos que aparecen en el plan (con refAlimento y cantidad)
    alimentosBase?: AlimentoBase[]; // El catálogo completo de alimentos
}

export default function TableAlimentos({ alimentos, alimentosBase }: TableAlimentosProps) {

    // Aseguramos que 'alimentosBase' exista para evitar fallos
    if (!alimentosBase) {
        return <p className="mt-4 text-red-400">Error: El catálogo de alimentos base no fue proporcionado.</p>;
    }

    return (
        <div className="overflow-x-auto mt-6">
            <table className="w-full text-sm text-left text-gray-300 border border-gray-700 rounded-xl overflow-hidden">
                <thead className="bg-gray-700 text-gray-200 uppercase text-xs">
                <tr>
                    <th className="px-4 py-3">Alimento</th>
                    <th className="px-4 py-3">Cantidad</th>
                    <th className="px-4 py-3 text-right">Proteínas (g)</th>
                    <th className="px-4 py-3 text-right">Carbs (g)</th>
                    <th className="px-4 py-3 text-right">Grasas (g)</th>
                </tr>
                </thead>
                <tbody>
                {alimentos.map((a, i) => {
                    // 1. **CORRECCIÓN:** Usar 'id' en el catálogo para buscar con 'refAlimento' del plan.
                    const base = alimentosBase.find(b => b.id === a.refAlimento);

                    if (!base) {
                        // Manejo de error si el alimento no se encuentra en la base de datos
                        return (
                            <tr key={i} className="bg-red-900/30 border-t border-gray-700">
                                <td className="px-4 py-3 font-semibold text-red-300">{a.refAlimento}</td>
                                <td colSpan={4} className="px-4 py-3 text-red-300">¡Alimento no encontrado en la base de datos!</td>
                            </tr>
                        );
                    }

                    // 2. **CORRECCIÓN:** Extraer cantidad numérica del plan ('a.cantidad')
                    const cantidadMatch = a.cantidad.match(/[\d,.]+/);
                    // Reemplaza coma por punto y convierte a número. Si falla, usa 0.
                    const cantidadNum = cantidadMatch ? parseFloat(cantidadMatch[0].replace(',', '.')) : 0;

                    // 3. Obtener valores base del catálogo
                    const cantidadBase = base.cantidadBase; // Porción de referencia (ej: 100)
                    const proteinasBase = base.proteina;
                    const carbohidratosBase = base.carbohidratos;
                    const grasasBase = base.grasas;

                    // 4. Calcular los macros para la porción específica
                    const factor = cantidadNum / cantidadBase;

                    const proteinas = proteinasBase * factor;
                    const carbohidratos = carbohidratosBase * factor;
                    const grasas = grasasBase * factor;

                    return (
                        <tr
                            key={i}
                            className="border-t border-gray-700 hover:bg-gray-800 transition duration-150"
                        >
                            <td className="px-4 py-3 font-semibold text-white">{base.nombre}</td>
                            <td className="px-4 py-3">{a.cantidad}</td>
                            <td className="px-4 py-3 text-right font-medium text-indigo-300">{proteinas.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-medium text-indigo-300">{carbohidratos.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-medium text-indigo-300">{grasas.toFixed(2)}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}