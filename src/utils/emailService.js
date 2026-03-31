/**
 * Service d'envoi d'emails
 * Supporte SMTP avec configuration flexible
 */

import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

// Gestion du chargement des variables d'environnement
// Essayer de charger .env depuis plusieurs emplacements possibles
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const possiblePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
];

// Charger dotenv - essayer chaque chemin
let envLoaded = false;
for (const envPath of possiblePaths) {
  try {
    // eslint-disable-next-line global-require
    const dotenv = require('dotenv');
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log('[EMAIL] Variables d\'environnement chargées depuis:', envPath);
      envLoaded = true;
      break;
    }
  } catch (e) {
    // Ignorer et essayer le suivant
  }
}

// Fallback: essayer avec process.cwd()
if (!envLoaded) {
  try {
    // eslint-disable-next-line global-require
    const dotenv = require('dotenv');
    dotenv.config();
  } catch (e) {
    // Ignore
  }
}

// Configuration SMTP depuis les variables d'environnement
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'noreply@gesticom.com';

// Debug: afficher les variables (sans le mot de passe)
console.log('[EMAIL] =====================');
console.log('[EMAIL] Configuration SMTP:');
console.log('[EMAIL] SMTP_HOST:', SMTP_HOST);
console.log('[EMAIL] SMTP_PORT:', SMTP_PORT);
console.log('[EMAIL] SMTP_USER:', SMTP_USER ? 'défini (' + SMTP_USER + ')' : 'non défini');
console.log('[EMAIL] SMTP_PASS:', SMTP_PASS ? 'défini (****)' : 'non défini');
console.log('[EMAIL] SMTP_FROM:', SMTP_FROM);
console.log('[EMAIL] =====================');

/**
 * Créer le transporteur nodemailer
 */
function createTransporter() {
  if (!SMTP_USER || !SMTP_PASS) {
    console.error('[EMAIL ERROR] SMTP credentials not configured');
    console.error('[EMAIL ERROR] SMTP_USER:', SMTP_USER ? 'défini' : 'non défini');
    console.error('[EMAIL ERROR] SMTP_PASS:', SMTP_PASS ? 'défini' : 'non défini');
    throw new Error('SMTP credentials not configured: SMTP_USER and SMTP_PASS must be set in .env or environment variables');
  }
  
  const config = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    // Options de connexion plus tolérantes
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  };
  
  // Ajout des options TLS pour les connexions non sécurisées (port 587)
  if (SMTP_PORT !== 465) {
    config.tls = {
      rejectUnauthorized: false
    };
  }
  
  console.log('[EMAIL] Configuration SMTP:', {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    user: SMTP_USER
  });
  
  return nodemailer.createTransport(config);
}

/**
 * Envoyer un email
 * @param {string} to - Destinataire
 * @param {string} subject - Sujet
 * @param {string} html - Contenu HTML
 * @param {string} text - Contenu texte (optionnel)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendEmail(to, subject, html, text = null) {
  // Validate email format
  if (!to || !to.includes('@')) {
    console.error('[EMAIL ERROR] Invalid email address:', to);
    return { success: false, error: 'Adresse email invalide' };
  }

  // Log SMTP configuration (without exposing password)
  console.log('[EMAIL] Checking SMTP configuration:');
  console.log('[EMAIL] SMTP_HOST:', SMTP_HOST);
  console.log('[EMAIL] SMTP_PORT:', SMTP_PORT);
  console.log('[EMAIL] SMTP_USER:', SMTP_USER ? 'SET' : 'NOT SET');
  
  // Check if SMTP credentials are configured
  if (!SMTP_USER || !SMTP_PASS) {
    console.error('[EMAIL ERROR] SMTP credentials not configured - cannot send email');
    return { 
      success: false, 
      error: 'Configuration SMTP manquante. Veuillez configurer SMTP_USER et SMTP_PASS dans le fichier .env',
      configured: false
    };
  }

  try {
    console.log(`[EMAIL] Préparation de l'envoi à ${to}...`);
    
    const transporter = createTransporter();
    
    // Send the email with timeout
    const mailOptions = {
      from: SMTP_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };
    
    console.log(`[EMAIL] Envoi du mail à ${to}...`);
    
    // Use Promise.race for timeout
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email send timeout (30s)')), 30000)
    );
    
    const info = await Promise.race([sendPromise, timeoutPromise]);

    console.log(`[EMAIL] Message envoyé avec succès: ${info.messageId}`);
    console.log(`[EMAIL] Réponse du serveur:`, info.response);
    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('[EMAIL ERROR] Erreur détaillée:', error.message);
    console.error('[EMAIL ERROR] Code:', error.code || 'N/A');
    console.error('[EMAIL ERROR] Command:', error.command || 'N/A');
    
    const errorMessage = error.message || 'Erreur inconnue lors de l\'envoi de l\'email';
    
    return { 
      success: false, 
      error: errorMessage,
      code: error.code
    };
  }
}

/**
 * Tester la connexion SMTP
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function testSMTPConnection() {
  if (!SMTP_USER || !SMTP_PASS) {
    return { 
      success: false, 
      message: 'SMTP non configuré. Veuillez définir SMTP_USER et SMTP_PASS dans le fichier .env',
      details: {
        hasUser: !!SMTP_USER,
        hasPass: !!SMTP_PASS
      }
    };
  }

  try {
    console.log('[EMAIL] Test de connexion SMTP...');
    const transporter = createTransporter();
    await transporter.verify();
    return { 
      success: true, 
      message: 'Connexion SMTP réussie!',
      config: {
        host: SMTP_HOST,
        port: SMTP_PORT
      }
    };
  } catch (error) {
    console.error('[EMAIL] Échec du test SMTP:', error.message);
    return { 
      success: false, 
      message: `Erreur: ${error.message}`,
      code: error.code
    };
  }
}

/**
 * Envoyer un email de réinitialisation de mot de passe
 * @param {string} email - Email du destinataire
 * @param {string} code - Code de vérification à 6 chiffres
 * @param {string} userName - Nom de l'utilisateur (optionnel)
 */
export async function sendPasswordResetEmail(email, code, userName = '') {
  const subject = 'Réinitialisation de votre mot de passe - GESTICOM';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #2563eb;
          color: #ffffff;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 30px;
          color: #333333;
        }
        .code-box {
          background-color: #f8f9fa;
          border: 2px dashed #2563eb;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .code {
          font-size: 36px;
          font-weight: bold;
          color: #2563eb;
          letter-spacing: 8px;
        }
        .warning {
          color: #dc2626;
          font-size: 14px;
          margin-top: 20px;
        }
        .footer {
          background-color: #f4f4f4;
          padding: 20px;
          text-align: center;
          color: #666666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Réinitialisation du mot de passe</h1>
        </div>
        <div class="content">
          <p>Bonjour${userName ? ' ' + userName : ''},</p>
          
          <p>Vous avez demandé la réinitialisation de votre mot de passe sur <strong>GESTICOM</strong>.</p>
          
          <p>Voici votre code de vérification :</p>
          
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          
          <p>Ce code est valide pendant <strong>15 minutes</strong>.</p>
          
          <p class="warning">
            ⚠️ Si vous n'avez pas demandé cette réinitialisation, ignorez cet email ou contactez l'administrateur.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} GESTICOM - Système de gestion de caisse</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}

/**
 * Envoyer un email de test
 * @param {string} to - Email de test
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function sendTestEmail(to) {
  const subject = 'Test de configuration SMTP - GESTICOM';
  const html = `
    <h1>Test de configuration SMTP</h1>
    <p>Si vous recevez cet email, la configuration SMTP est correcte!</p>
    <p>Date: ${new Date().toISOString()}</p>
  `;
  return sendEmail(to, subject, html);
}
