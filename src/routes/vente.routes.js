import express from 'express';
import venteController from '../controllers/vente.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'gerant', 'caissier']),
  venteController.create
);
router.post(
  '/:id/annuler',
  authMiddleware,
  roleMiddleware(['admin', 'gerant']),
  venteController.annuler
);

export default router;