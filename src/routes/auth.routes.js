

import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcrypt';
import authController from '../controllers/auth.controller.js';
import { validateLogin } from '../validators/auth.validator.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import prisma from '../config/database.js';

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // 100 tentatives par 15 minutes
  message: {
    success: false,
    message: "Trop de tentatives. Réessayez dans 15 minutes."
  }
});

router.post('/login', loginLimiter, validateLogin, authController.login);

// Route pour créer le premier utilisateur admin (utiliser une seule fois)
router.post('/setup', async (req, res) => {
  try {
    // Vérifier si des utilisateurs existent déjà
    const userCount = await prisma.user.count();
    
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Un utilisateur existe déjà. Cette route est désactivée."
      });
    }
    
    // Créer l'admin par défaut
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    
    const admin = await prisma.user.create({
      data: {
        nom: 'Admin',
        telephone: '771428150',
        email: 'admin@gesticom.com',
        password: hashedPassword,
        role: 'admin',
        statut: 'actif'
      }
    });
    
    res.status(201).json({
      success: true,
      message: "Administrateur créé avec succès",
      credentials: {
        telephone: '771428150',
        password: 'admin1234'
      }
    });
  } catch (error) {
    console.error('[SETUP ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'administrateur",
      error: error.message
    });
  }
});

// Routes pour mot de passe oublié
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Route pour tester la connexion SMTP
router.post('/test-email', async (req, res) => {
  const { testSMTPConnection } = await import('../utils/emailService.js');
  const result = await testSMTPConnection();
  res.json(result);
});

// Route pour récupérer l'utilisateur connecté
router.get('/me', authMiddleware, authController.me);

// Route pour gérer les utilisateurs (admin seulement)
router.get('/users', authMiddleware, authController.getAllUsers);
router.post('/users', authMiddleware, upload.single('photo'), authController.createUser);
router.put('/users/:id', authMiddleware, upload.single('photo'), authController.updateUser);
router.patch('/users/:id/statut', authMiddleware, authController.updateUser);
router.delete('/users/:id', authMiddleware, authController.deleteUser);

// Route pour mettre à jour sa propre photo de profil
router.put('/users/me/photo', authMiddleware, upload.single('photo'), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const photo = req.file ? req.file.filename : null;
    
    if (!photo) {
      return res.status(400).json({ success: false, message: "Aucune photo fournie" });
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { photo }
    });
    
    // Return full URL for the photo (use dynamic base URL)
    const baseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const photoUrl = `${baseUrl}/uploads/${photo}`;
    res.json({ success: true, message: "Photo mise à jour", photo: photoUrl });
  } catch (error) {
    next(error);
  }
});

// Route pour changer le mot de passe
router.post('/change-password', authMiddleware, authController.changePassword);

export default router;
