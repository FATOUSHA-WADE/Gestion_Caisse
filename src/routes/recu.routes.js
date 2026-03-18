import express from 'express';
import recuController from '../controllers/recu.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/:venteId',
  authMiddleware,
  recuController.get
);

// Route pour télécharger le PDF
router.get('/:venteId/pdf',
  authMiddleware,
  recuController.downloadPdf
);

export default router;