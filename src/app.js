
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import errorHandler from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.routes.js';import categorieRoutes from './routes/categorie.routes.js';
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

app.get('/', (req, res) => {
  res.json({ message: "CaisseManager API fonctionne 🚀" });
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
