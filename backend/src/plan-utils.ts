// backend/src/plan-utils.ts

import { firestore } from 'firebase-admin';

// Alimento maestro
export interface Alimento {
    id: string;
    nombre: string;
    proteina: number;
    grasas: number;
    carbohidratos: number;
    calorias: number;
}

// Interfaz para el 'req.body' del frontend
export interface PlanPayload {
    nombre: string;
    tipo: 'Volumen' | 'Recomposición';
    comidas: ComidaPayload[];
}

export interface ComidaPayload {
    nombre: string;
    // El frontend envía esto
    alimentos: Array<{
        refAlimento: string; // id alimento
        cantidad: string;
    }>;
}

// "parser" numérico
const parseNumber = (value: any): number => {
    const num = parseFloat(value);
    return isNaN(num) || num === null || value === undefined ? 0 : num;
};

// "parser" para la cantidad
const parseCantidad = (cantidadStr: string): number => {
    return parseNumber(cantidadStr.replace(/[^0-9.]/g, ''));
};


 // Recalcula todos los macros de un plan basándose en los datos de Firestore

export async function calcularMacrosPlan(
    db: firestore.Firestore,
    comidasPayload: ComidaPayload[]
) {
    const todasLasComidas = [];
    let totalesDiarios = { kcal: 0, proteinas: 0, grasas: 0, carbohidratos: 0 };

    // Obtener todos los ID de alimentos únicos para una sola consulta a la BD
    const alimentoIds = new Set<string>();
    comidasPayload.forEach(comida => {
        comida.alimentos.forEach(alimento => {
            alimentoIds.add(alimento.refAlimento);
        });
    });

    if (alimentoIds.size === 0) {
        return { comidasParaGuardar: [], totalesDiarios };
    }

    // Hacer una sola consulta a Firestore con todos los ID
    const alimentosMap = new Map<string, Alimento>();
    const alimentosRef = db.collection('alimentos');
    const snapshot = await alimentosRef.where(firestore.FieldPath.documentId(), 'in', Array.from(alimentoIds)).get();

    snapshot.forEach(doc => {
        const data = doc.data();
        // Limpiar los datos de la BD
        const prot = parseNumber(data.proteina || data.proteinas);
        const carb = parseNumber(data.carbohidratos);
        const fat = parseNumber(data.grasas);
        const cal = parseNumber(data.calorias || data.kcal);
        const caloriasCalculadas = cal || (prot * 4 + carb * 4 + fat * 9);

        alimentosMap.set(doc.id, {
            id: doc.id,
            nombre: data.nombre || 'Alimento sin nombre',
            proteina: prot,
            grasas: fat,
            carbohidratos: carb,
            calorias: caloriasCalculadas,
        });
    });

    // Iterar y calcular
    for (const comida of comidasPayload) {
        let macrosComida = { kcal: 0, proteinas: 0, grasas: 0, carbohidratos: 0 };

        // Filtramos alimentos que no se encontraron en la BD
        const alimentosValidos = comida.alimentos.filter(alimento => alimentosMap.has(alimento.refAlimento));

        for (const alimento of alimentosValidos) {
            const alimentoData = alimentosMap.get(alimento.refAlimento)!;
            const cantidadNum = parseCantidad(alimento.cantidad);
            const factor = cantidadNum / 100; // Asumiendo macros base por 100g

            macrosComida.kcal += (alimentoData.calorias || 0) * factor;
            macrosComida.proteinas += (alimentoData.proteina || 0) * factor;
            macrosComida.grasas += (alimentoData.grasas || 0) * factor;
            macrosComida.carbohidratos += (alimentoData.carbohidratos || 0) * factor;
        }

        // Acumulamos para los totales diarios
        totalesDiarios.kcal += macrosComida.kcal;
        totalesDiarios.proteinas += macrosComida.proteinas;
        totalesDiarios.grasas += macrosComida.grasas;
        totalesDiarios.carbohidratos += macrosComida.carbohidratos;

        // Añadimos al array de comidas (esto es lo que irá a la BD)
        todasLasComidas.push({
            nombre: comida.nombre,
            descripcion: '',
            alimentos: comida.alimentos, // referencia directa
            macros: macrosComida, // Guardamos los macros calculados y verificados
        });
    }

    return { comidasParaGuardar: todasLasComidas, totalesDiarios };
}