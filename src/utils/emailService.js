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
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

/**
 * Créer le transporteur nodemailer
 */
function createTransporter() {
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP credentials not configured');
  }
  
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: parseInt(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
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

  // Check if SMTP credentials are configured
  if (!SMTP_USER || !SMTP_PASS || SMTP_USER === 'your_email@gmail.com') {
    console.log(`[EMAIL SIMULÉ] SMTP non configuré - Email simulé`);
    console.log(`[EMAIL SIMULÉ] À: ${to}, Sujet: ${subject}`);
    const code = html.match(/(\d{6})/)?.[1] || 'non trouvé';
    console.log(`[EMAIL SIMULÉ] Code de vérification: ${code}`);
    return { 
      success: true, 
      messageId: `sim_${Date.now()}`,
      simulated: true 
    };
  }

  try {
    console.log(`[EMAIL] Préparation de l'envoi à ${to}...`);
    console.log(`[EMAIL] Serveur SMTP: ${SMTP_HOST}:${SMTP_PORT}`);
    console.log(`[EMAIL] Utilisateur: ${SMTP_USER}`);
    
    const transporter = createTransporter();
    
    // Verify connection with timeout
    const verifyPromise = transporter.verify();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('SMTP connection timeout')), 10000)
    );
    
    await Promise.race([verifyPromise, timeoutPromise]);
    console.log(`[EMAIL] Connexion SMTP établie avec succès`);
    
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Plain text fallback
    });

    console.log(`[EMAIL] Message envoyé avec succès: ${info.messageId}`);
    console.log(`[EMAIL] Réponse SMTP: ${info.response}`);
    return { 
      success: true, 
      messageId: info.messageId 
    };
  } catch (error) {
    console.error('[EMAIL ERROR]', error.message);
    console.error('[EMAIL ERROR] Stack:', error.stack);
    
    if (error.message === 'SMTP connection timeout') {
      return { 
        success: false, 
        error: 'Délai de connexion SMTP dépassé. Vérifiez votre connexion internet.' 
      };
    }
    
    if (error.code === 'EAUTH' || error.message?.includes('Invalid credentials')) {
      console.error('[EMAIL] Erreur d\'authentification SMTP. Vérifiez vos identifiants.');
      return { 
        success: false, 
        error: 'Erreur d\'authentification SMTP. Veuillez vérifier les identifiants dans les variables d\'environnement.' 
      };
    } else if (error.code === 'ECONNECTION' || error.message?.includes('ECONNREFUSED')) {
      console.error('[EMAIL] Impossible de se connecter au serveur SMTP.');
      return { 
        success: false, 
        error: 'Impossible de se connecter au serveur SMTP. Vérifiez la connexion internet.' 
      };
    } else if (error.responseCode === 535 || error.message?.includes('535')) {
      console.error('[EMAIL] Authentification échouée. Le mot de passe d\'application peut être invalide.');
      return { 
        success: false, 
        error: 'Mot de passe d\'application invalide. Veuillez en générer un nouveau dans votre compte Google.' 
      };
    }
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Tester la connexion SMTP
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function testSMTPConnection() {
  if (!SMTP_USER || !SMTP_PASS) {
    return { success: false, message: 'SMTP non configuré dans les variables d\'environnement' };
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Connexion SMTP réussie!' };
  } catch (error) {
    return { success: false, message: `Erreur: ${error.message}` };
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
