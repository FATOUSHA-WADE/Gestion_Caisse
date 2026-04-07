

import authService from '../services/auth.service.js';
import prisma from '../config/database.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../utils/emailService.js';
import { normalizePhoneNumber } from '../utils/phone.utils.js';

class AuthController {

  async login(req, res, next) {
    try {
      const { telephone, password } = req.body;

      if (!telephone || !password) {
        return res.status(400).json({
          success: false,
          message: "Téléphone et mot de passe obligatoires"
        });
      }

      const data = await authService.login(telephone, password);

      res.status(200).json({
        success: true,
        message: "Connexion réussie",
        data
      });

    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { identifier } = req.body;
      
      console.log('[Auth] forgotPassword called:', { identifier });

      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: "Veuillez fournir un numéro de téléphone ou un email"
        });
      }

      const normalizedIdentifier = normalizePhoneNumber(identifier);

      // Chercher l'utilisateur par téléphone ou email
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { telephone: normalizedIdentifier },
            { telephone: identifier },
            { email: identifier }
          ]
        }
      });

      console.log('[Auth] User found:', user ? { id: user.id, email: user.email } : null);

      if (!user) {
        // Pour des raisons de sécurité, on ne révèle pas si l'utilisateur existe ou non
        return res.status(200).json({
          success: true,
          message: "Si un compte existe avec ces informations, un code de vérification sera envoyé"
        });
      }

      // Vérifier que l'utilisateur a un email
      if (!user.email) {
        return res.status(400).json({
          success: false,
          message: "Aucun email associé à ce compte. Veuillez contacter l'administrateur."
        });
      }

      // Générer un code de vérification à 6 chiffres
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Stocker le code de vérification (avec expiration de 15 minutes)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      // Supprimer les anciens codes de vérification pour cet utilisateur
      await prisma.passwordReset.deleteMany({
        where: { userId: user.id }
      });
      
      // Créer un nouveau code de vérification
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          code: verificationCode,
          expiresAt: expiresAt,
          used: false
        }
      });

      console.log('[Auth] Code généré:', verificationCode, 'pour userId:', user.id);

      // Envoyer le code par email si l'utilisateur a un email
      if (user.email) {
        try {
          const emailResult = await sendPasswordResetEmail(user.email, verificationCode, user.nom);
          
          console.log(`Email send result:`, emailResult);
          
          // En cas d'erreur, logger mais ne pas bloquer le processus
          if (!emailResult.success) {
            console.error('[EMAIL] Failed to send email:', emailResult.error);
          }
          
          // Afficher le code en mode développement pour les tests
          if (emailResult.simulated || process.env.NODE_ENV === 'development') {
            console.log(`[DÉVELOPPEMENT] Code de vérification: ${verificationCode}`);
          }
        } catch (emailError) {
          console.error("Erreur envoi email:", emailError);
        }
      } else {
        // Pas d'email, renvoyer un message d'erreur
        return res.status(400).json({
          success: false,
          message: "Aucun email associé à ce compte. Veuillez contacter l'administrateur."
        });
      }

      // En développement, toujours afficher le code pour les tests
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        console.log(`Code de vérification pour ${user.email}: ${verificationCode}`);
      }

      // Masquer l'email pour l'affichage (ex: j***@gmail.com)
      const maskedEmail = user.email.replace(/(.{1})(.*)(@.*)/, '$1***$3');

      res.status(200).json({
        success: true,
        message: "Un code de vérification a été envoyé à votre adresse email",
        email: maskedEmail,
        token: Buffer.from(`${user.id}:${Date.now()}`).toString('base64')
      });

    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, code, newPassword } = req.body;
      
      console.log('[Auth] resetPassword called:', { 
        tokenLength: token?.length, 
        codeLength: code?.length,
        hasPassword: !!newPassword 
      });

      if (!token || !code || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Token, code et nouveau mot de passe sont obligatoires"
        });
      }

      // Valider la longueur du mot de passe
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Le mot de passe doit contenir au moins 8 caractères"
        });
      }

      // Décoder le token pour obtenir l'ID utilisateur
      let userId;
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        userId = parseInt(decoded.split(':')[0]);
        console.log('[Auth] Token decoded, userId:', userId);
      } catch (e) {
        console.log('[Auth] Token decode error:', e.message);
        return res.status(400).json({
          success: false,
          message: "Token invalide"
        });
      }

      // Vérifier le code de vérification
      const resetRecord = await prisma.passwordReset.findFirst({
        where: {
          userId: userId,
          code: code,
          used: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      console.log('[Auth] Reset record found:', !!resetRecord);

      if (!resetRecord) {
        return res.status(400).json({
          success: false,
          message: "Code de vérification invalide ou expiré"
        });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour le mot de passe de l'utilisateur
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Marquer le code comme utilisé
      await prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true }
      });

      console.log('[Auth] Password reset successful for userId:', userId);

      res.status(200).json({
        success: true,
        message: "Mot de passe réinitialisé avec succès"
      });

    } catch (error) {
      console.error('[Auth] resetPassword error:', error);
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nom: true,
          telephone: true,
          email: true,
          role: true,
          photo: true,
          statut: true,
          createdAt: true
        }
      });

      // Add full photo URL (use dynamic base URL)
      if (user.photo) {
        const baseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
        user.photo = user.photo.startsWith('http') 
          ? user.photo 
          : `${baseUrl}/uploads/${user.photo}`;
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          nom: true,
          telephone: true,
          email: true,
          role: true,
          photo: true,
          statut: true,
          createdAt: true,
          derniereConnexion: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Add full photo URLs to each user
      const usersWithPhotoUrls = users.map(user => {
        const baseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
        return {
          ...user,
          photo: user.photo 
            ? (user.photo.startsWith('http') ? user.photo : `${baseUrl}/uploads/${user.photo}`)
            : null
        };
      });

      res.json({ success: true, data: usersWithPhotoUrls });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const { nom, telephone, email, password, role } = req.body;
      let photo = null;
      if (req.file) {
        photo = req.file.filename;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const normalizedTelephone = normalizePhoneNumber(telephone);

      const user = await prisma.user.create({
        data: {
          nom,
          telephone: normalizedTelephone,
          email,
          password: hashedPassword,
          role: role || 'caissier',
          photo
        },
        select: {
          id: true,
          nom: true,
          telephone: true,
          email: true,
          role: true,
          photo: true,
          createdAt: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { nom, telephone, email, password, role, statut } = req.body;

      const data = { nom, email, role, statut };
      
      if (telephone) {
        data.telephone = normalizePhoneNumber(telephone);
      }
      
      // Handle photo upload
      if (req.file) {
        data.photo = req.file.filename;
      }
      
      if (password) {
        data.password = await bcrypt.hash(password, 10);
      }

      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data,
        select: {
          id: true,
          nom: true,
          telephone: true,
          email: true,
          role: true,
          photo: true,
          statut: true,
          updatedAt: true
        }
      });

      // Add full photo URL to response
      if (user.photo) {
        const baseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
        user.photo = user.photo.startsWith('http') ? user.photo : `${baseUrl}/uploads/${user.photo}`;
      }

      res.json({
        success: true,
        message: 'Utilisateur mis à jour',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'Utilisateur supprimé'
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Mot de passe actuel et nouveau mot de passe obligatoires"
        });
      }

      // Get current user with password
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Mot de passe actuel incorrect"
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      res.json({
        success: true,
        message: "Mot de passe modifié avec succès"
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
