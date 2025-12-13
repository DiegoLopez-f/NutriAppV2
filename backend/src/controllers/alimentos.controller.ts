import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const obtenerAlimentos = async (req: Request, res: Response) => {
    try {
        console.log('[GET] /api/alimentos - Obteniendo lista de alimentos.');
        const snapshot = await db.collection('alimentos').get();
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log(`Se devolvieron ${list.length} alimentos.`);
        res.status(200).send(list);
    } catch (error) {
        console.error('Error al obtener alimentos:', error);
        res.status(500).send({ message: 'Error interno.' });
    }
};