import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import parametreController from '../controllers/parametre.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';
import { testSMTPConnection } from '../utils/emailService.js';

// Setup uploads directory for settings logo
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const router = express.Router();

// Get settings (accessible to authenticated users)
router.get('/', authMiddleware, parametreController.get);

// Update settings (admin only)
router.put('/', authMiddleware, roleMiddleware(['admin']), upload.single('logo'), parametreController.update);

// Test SMTP connection (admin only)
router.post('/test-smtp', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    console.log('[ROUTE] Test SMTP demandé');
    const result = await testSMTPConnection();
    res.json(result);
  } catch (error) {
    console.error('[ROUTE] Erreur test SMTP:', error);
    res.status(500).json({ 
      success: false, 
      message: `Erreur: ${error.message}` 
    });
  }
});

export default router;
