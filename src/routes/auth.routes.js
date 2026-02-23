
import express from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/auth.controller.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: {
    success: false,
    message: "Trop de tentatives. Réessayez dans 15 minutes."
  }
});

router.post('/login', loginLimiter, authController.login);

export default router;
