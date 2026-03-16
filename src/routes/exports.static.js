// Permet de servir le dossier exports/ pour les PDF de reçus
import express from 'express';
import path from 'path';

const router = express.Router();

router.use('/exports', express.static(path.join(process.cwd(), 'exports')));

export default router;
