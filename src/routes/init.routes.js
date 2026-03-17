/**
 * Route d'initialisation de la base de données
 * Crée un utilisateur administrateur par défaut si aucun utilisateur n'existe
 */

import express from 'express';
import prisma from '../config/database.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Route pour initialiser la base de données avec un admin par défaut
router.post('/init', async (req, res) => {
  try {
    // Vérifier si des utilisateurs existent déjà
    const existingUsers = await prisma.user.count();
    
    if (existingUsers > 0) {
      return res.json({
        success: true,
        message: "La base de données contient déjà des utilisateurs",
        usersCount: existingUsers
      });
    }

    // Créer un utilisateur administrateur par défaut
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        nom: 'Administrateur',
        telephone: '771428150',
        email: 'admin@gésticom.com',
        password: hashedPassword,
        role: 'admin',
        statut: 'actif',
      },
      select: {
        id: true,
        nom: true,
        telephone: true,
        email: true,
        role: true,
        statut: true
      }
    });

    // Créer quelques catégories par défaut
    const categories = await Promise.all([
      prisma.categorie.create({
        data: { nom: 'Boissons', description: 'Boissons gazeuses, eaux, jus', statut: 'actif' }
      }),
      prisma.categorie.create({
        data: { nom: 'Alimentaire', description: 'Produits alimentaires divers', statut: 'actif' }
      }),
      prisma.categorie.create({
        data: { nom: 'Papeterie', description: 'Articles de papeterie et bureau', statut: 'actif' }
      }),
      prisma.categorie.create({
        data: { nom: 'Hygiene', description: 'Produits d\'hygiène personnelle', statut: 'actif' }
      })
    ]);

    res.status(201).json({
      success: true,
      message: "Base de données initialisée avec succès",
      admin: adminUser,
      defaultCredentials: {
        telephone: '771428150',
        password: 'admin1234'
      },
      categoriesCreated: categories.length
    });
  } catch (error) {
    console.error('[INIT ERROR]', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'initialisation",
      error: error.message
    });
  }
});

// Route pour vérifier l'état de la base de données
router.get('/status', async (req, res) => {
  try {
    const usersCount = await prisma.user.count();
    const categoriesCount = await prisma.categorie.count();
    const produitsCount = await prisma.produit.count();
    const ventesCount = await prisma.vente.count();

    res.json({
      success: true,
      database: {
        users: usersCount,
        categories: categoriesCount,
        produits: produitsCount,
        ventes: ventesCount
      },
      initialized: usersCount > 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification",
      error: error.message
    });
  }
});

export default router;
