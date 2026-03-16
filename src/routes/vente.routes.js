import express from 'express';
import venteController from '../controllers/vente.controller.js';
import { validateVente } from '../validators/vente.validator.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';

const router = express.Router();

// Routes pour créer et lister les ventes
router.get('/', authMiddleware, venteController.getAll);

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'gerant', 'caissier']),
  validateVente,
  venteController.create
);

router.post(
  '/:id/annuler',
  authMiddleware,
  roleMiddleware(['admin', 'gerant']),
  venteController.annuler
);

router.get('/:id', authMiddleware, venteController.getById);

export default router;