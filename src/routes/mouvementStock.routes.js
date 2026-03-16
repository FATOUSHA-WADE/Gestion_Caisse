import express from 'express';
import mouvementStockController from '../controllers/mouvementStock.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, mouvementStockController.getAll);
router.get('/:id', authMiddleware, mouvementStockController.getById);
router.post('/', authMiddleware, mouvementStockController.create);

export default router;
