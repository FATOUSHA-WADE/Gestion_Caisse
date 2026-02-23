import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import errorHandler from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import categorieRoutes from './routes/categorie.routes.js';
import produitRoutes from './routes/produit.routes.js';
import venteRoutes from './routes/vente.routes.js';
import recuRoutes from './routes/recu.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import './listeners/notification.listener.js';
import { verifierCAJournalier } from './listeners/notification.listener.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Ajoutez cette ligne pour servir le dossier public statiquement
app.use('/public', express.static(path.join(process.cwd(), 'public')));

app.get('/', (req, res) => {
  res.json({ message: "CaisseManager API fonctionne 🚀" });
});

// La route pour api-docs.json peut rester ou être supprimée si vous utilisez la statique
app.get('/api', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public/docs/api-docs.json'));
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/ventes', venteRoutes);
app.use('/api/recus', recuRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

setInterval(() => {
  verifierCAJournalier();
}, 1000 * 60 * 60 * 6);

app.use(errorHandler);

export default app;
