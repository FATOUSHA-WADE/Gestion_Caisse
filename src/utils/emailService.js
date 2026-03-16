/**
 * Service d'envoi d'emails
 * Supporte SMTP avec configuration flexible
 */

import nodemailer from 'nodemailer';

// Configuration SMTP depuis les variables d'environnement
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'fkwade026@gmail.com';

/**
 * Créer le transporteur nodemailer
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: SMTP_PORT === '465',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

/**
 * Envoyer un email
 * @param {string} to - Destinataire
 * @param {string} subject - Sujet
 * @param {string} html - Contenu HTML
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendEmail(to, subject, html) {
  // Vérifier si les credentials SMTP sont configurés
  if (!SMTP_USER || !SMTP_PASS || SMTP_USER === 'your_email@gmail.com' || SMTP_PASS === 'your_app_password') {
    console.log(`[EMAIL SIMULÉ] SMTP non configuré - Email simulé`);
    console.log(`[EMAIL SIMULÉ] À: ${to}, Sujet: ${subject}`);
    console.log(`[EMAIL SIMULÉ] Code de vérification (pour tests): ${html.match(/(\d{6})/)?.[1] || 'non trouvé'}`);
    return { 
      success: true, 
      messageId: `sim_${Date.now()}`,
      simulated: true 
    };
  }

  try {
    const transporter = createTransporter();
    
    // Verify connection
    await transporter.verify();
    console.log(`[EMAIL] Connexion SMTP établie avec succès`);
    
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html
    });

    console.log(`[EMAIL] Message envoyé avec succès: ${info.messageId}`);
    return { 
      success: true, 
      messageId: info.messageId 
    };
  } catch (error) {
    console.error('[EMAIL ERROR]', error.message);
    if (error.code === 'EAUTH') {
      console.error('[EMAIL] Erreur d\'authentification SMTP. Vérifiez vos identifiants.');
    } else if (error.code === 'ECONNECTION') {
      console.error('[EMAIL] Impossible de se connecter au serveur SMTP.');
    }
    return { 
      success: false, 
      error: error.message 
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
