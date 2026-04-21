/**
 * Service d'envoi d'emails
 * Supporte SMTP avec configuration flexible
 * 
 * NOTE: Les variables d'environnement sont chargées par server.js (dotenv/config)
 * Ce module utilise directement process.env qui doit déjà être configuré
 */

import nodemailer from 'nodemailer';

// Helper function to get SMTP config at runtime (not at module load)
// Exported for testing
export function getSMTPConfig() {
  // Check environment variables - supports both local (.env) and production (Render env vars)
  // Use production vars if set, otherwise fall back to local vars
  const config = {
    host: process.env.SMTP_HOST_PRODUCTION || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT_PRODUCTION) || parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT_PRODUCTION) === 465 || parseInt(process.env.SMTP_PORT) === 465,
    user: process.env.SMTP_USER_PRODUCTION || process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS_PRODUCTION || process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM_PRODUCTION || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@gesticom.com',
    // Disable pooling for production (Render)
    disablePool: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
  };
  
  console.log('[EMAIL] Runtime SMTP check - User:', !!config.user, '| Pass:', !!config.pass, '| Host:', config.host, '| Port:', config.port);
  
  return config;
}

console.log('[EMAIL] Email service loaded');


/**
 * Créer le transporteur nodemailer
 */
function createTransporter() {
  const smtp = getSMTPConfig();
  
  if (!smtp.user || !smtp.pass) {
    console.warn('[EMAIL] SMTP credentials not configured - emails will be simulated');
    return null;
  }
  
  const isGmail = smtp.host.includes('gmail') || smtp.host.includes('googlemail');
  
  const config = {
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure || smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass
    },
    // Disable pooling en production (Render) pour éviter les problèmes de connexion persistante
    pool: !smtp.disablePool,
    maxConnections: smtp.disablePool ? 1 : 1,
    maxMessages: smtp.disablePool ? 1 : 100,
    rateDelta: 1000,
    rateLimit: 5,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
  };
  
  // TLS/STARTTLS pour port 587 ou Gmail
  if (isGmail || smtp.port === 587 || smtp.port === 587) {
    config.tls = {
      rejectUnauthorized: false,
      ciphers: 'DEFAULT:!aNULL:!EXP:!LOW:!RC4:!DHE'
    };
  }

  console.log('[EMAIL] Creating transporter for:', smtp.user.substring(0, 3) + '*** | Pool:', !smtp.disablePool);

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
  const smtp = getSMTPConfig();
  
  if (!to || !to.includes('@')) {
    console.error('[EMAIL ERROR] Invalid email address:', to);
    return { success: false, error: 'Adresse email invalide' };
  }

  console.log('[EMAIL] Preparing to send to:', to);
  
  if (!smtp.user || !smtp.pass) {
    console.warn('[EMAIL] SMTP credentials not configured - simulating email send');
    return { 
      success: true, 
      simulated: true,
      message: 'Email simulé (SMTP non configuré)',
      messageId: `sim-${Date.now()}`
    };
  }

  let lastError = null;
  const maxRetries = 2;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[EMAIL] Attempt ${attempt}/${maxRetries} to send email to:`, to);
      
      const transporter = createTransporter();
      if (!transporter) {
        console.error('[EMAIL] Transporter creation failed');
        return { success: false, error: 'Transporter non disponible' };
      }
      
      const mailOptions = {
        from: smtp.from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '')
      };
      
      const info = await transporter.sendMail(mailOptions);

      console.log(`[EMAIL] ✅ Envoyé avec succès! MessageId: ${info.messageId}`);
      return { 
        success: true, 
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      lastError = error;
      console.error(`[EMAIL ERROR] Attempt ${attempt} failed:`, error.message);
      console.error('[EMAIL ERROR] Code:', error.code);
      
      // Si c'est une erreur d'authentification, on arrête immédiatement
      if (error.code === 'EAUTH' || error.code === 'EAUTHENUM') {
        console.error('[EMAIL] Authentication error - stopping retries');
        break;
      }
      
      // Attendre un peu avant de réessayer (sauf au dernier essai)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  return { 
    success: false, 
    error: lastError?.message || 'Erreur inconnue',
    code: lastError?.code
  };
}

/**
 * Tester la connexion SMTP
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function testSMTPConnection() {
  const smtp = getSMTPConfig();
  
  if (!smtp.user || !smtp.pass) {
    return { 
      success: false, 
      message: 'SMTP non configuré. Veuillez définir SMTP_USER et SMTP_PASS dans le fichier .env',
      details: {
        hasUser: !!smtp.user,
        hasPass: !!smtp.pass
      }
    };
  }

  try {
    console.log('[EMAIL] Test connexion SMTP...');
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, message: 'Transporter non disponible' };
    }
    await transporter.verify();
    return { 
      success: true, 
      message: 'Connexion SMTP réussie!',
      config: {
        host: smtp.host,
        port: smtp.port
      }
    };
  } catch (error) {
    console.error('[EMAIL] Échec test SMTP:', error.message);
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
