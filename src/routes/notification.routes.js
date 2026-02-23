
import express from 'express';
import jwt from 'jsonwebtoken';
import SSEManager from '../config/sseManager.js';
// Correction : utilise process.env.JWT_SECRET directement
import notificationController from '../controllers/notification.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';


const router = express.Router();

router.use(authMiddleware);

router.get('/', notificationController.getMesNotifications);
router.get('/count', notificationController.getCount);
router.patch('/toutes-lues', notificationController.marquerToutesLues);
router.patch('/:id/lue', notificationController.marquerLue);
router.get('/stream', async (req, res) => {

  try {

    const token = req.query.token;

    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.flushHeaders();

    SSEManager.addClient(userId, res);

    res.write(`data: ${JSON.stringify({ message: "Connexion SSE établie" })}\n\n`);

    req.on('close', () => {
      SSEManager.removeClient(userId);
    });

  } catch (error) {
    return res.status(401).json({ message: "Token invalide" });
  }

});
export default router;