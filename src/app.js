import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import errorHandler from './middlewares/errorHandler.js';
import exportsStatic from './routes/exports.static.js';
import authRoutes from './routes/auth.routes.js';
import categorieRoutes from './routes/categorie.routes.js';
import produitRoutes from './routes/produit.routes.js';
import venteRoutes from './routes/vente.routes.js';
import recuRoutes from './routes/recu.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import mouvementStockRoutes from './routes/mouvementStock.routes.js';
import './listeners/notification.listener.js';
import { verifierCAJournalier } from './listeners/notification.listener.js';

dotenv.config();
const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'https://gestion-caisse-frontend.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Servir les fichiers statiques (images, uploads, exports, public)
app.use('/images', express.static(path.join(process.cwd(), 'images')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/exports', express.static(path.join(process.cwd(), 'exports')));
app.use('/public', express.static(path.join(process.cwd(), 'public')));

app.get('/', (req, res) => {
  res.json({ message: "GestiCom API fonctionne 🚀" });
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
app.use('/api/mouvements-stock', mouvementStockRoutes);

setInterval(() => {
  verifierCAJournalier();
}, 1000 * 60 * 60 * 6);

app.use(errorHandler);

export default app;
