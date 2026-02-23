import multer from 'multer';

import express from 'express';
import produitController from '../controllers/produit.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';
import fs from 'fs';
import path from 'path';

// Création du dossier images s'il n'existe pas
const imagesDir = path.join(process.cwd(), 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    // Utilise le nom original de l'image
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

const router = express.Router();

router.get('/', authMiddleware, produitController.getAll);
router.get('/alertes',
  authMiddleware,
  roleMiddleware(['admin', 'gerant']),
  produitController.alertes
);

router.get('/:id', authMiddleware, produitController.getById);

router.post('/',
  authMiddleware,
  roleMiddleware(['admin', 'gerant']),
  upload.single('image'),
  produitController.create
);

router.put('/:id',
  authMiddleware,
  roleMiddleware(['admin', 'gerant']),
  upload.single('image'),
  produitController.update
);

router.delete('/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  produitController.delete
);

export default router;