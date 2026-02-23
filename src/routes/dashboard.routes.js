import express from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/stats', authMiddleware, dashboardController.stats);
router.get('/chart', authMiddleware, dashboardController.chart);

export default router;