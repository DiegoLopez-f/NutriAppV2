import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    // Validar que el header exista y tenga el formato correcto
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).send('No autorizado: Se requiere un token.');
    }

    // Extraer el token
    const idToken = authHeader.split('Bearer ')[1];

    // Validar que idToken no sea undefined antes de usarlo
    if (!idToken) {
        return res.status(403).send('No autorizado: Token malformado.');
    }

    try {
        // idToken es un string seguro
        const decodedToken = await auth.verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(403).send('No autorizado: Token inválido o expirado.');
    }
}