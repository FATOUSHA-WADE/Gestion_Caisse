import express from 'express';
import categorieController from '../controllers/categorie.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, categorieController.getAll);
router.get('/:id', authMiddleware, categorieController.getById);

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'gerant']),
  categorieController.create
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'gerant']),
  categorieController.update
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  categorieController.delete
);

export default router;