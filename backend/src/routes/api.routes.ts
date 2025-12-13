import { Router } from 'express';
import { verifyFirebaseToken } from '../middlewares/auth';
import * as UserController from '../controllers/usuario.controller';
import * as PlanController from '../controllers/planes.controller';
import * as FoodController from '../controllers/alimentos.controller';

const router = Router();

// Rutas de Usuarios
router.post('/usuarios', verifyFirebaseToken, UserController.registrarUsuario);
router.get('/perfil', verifyFirebaseToken, UserController.obtenerPerfil);
router.put('/perfil', verifyFirebaseToken, UserController.actualizarPerfil);
router.get('/protegido', verifyFirebaseToken, (req, res) => {
    res.status(200).send({ message: `¡Hola ${req.user?.email}!`, uid: req.user?.uid });
});

// Rutas de Nutricionista
router.get('/nutricionista/pacientes', verifyFirebaseToken, UserController.obtenerPacientes);
router.get('/nutricionista/todos-los-planes', verifyFirebaseToken, PlanController.obtenerTodosLosPlanesGlobal);

// Rutas de Planes
router.get('/planes/asignados', verifyFirebaseToken, PlanController.obtenerPlanesAsignados);
router.post('/planes', verifyFirebaseToken, PlanController.crearPlan);
router.delete('/planes/:planId', verifyFirebaseToken, PlanController.eliminarPlan);

// Rutas de Alimentos
router.get('/alimentos', verifyFirebaseToken, FoodController.obtenerAlimentos);

// Rutas de Prueba
router.get('/test', (req, res) => res.status(200).send({ message: 'Backend funcionando' }));

export default router;