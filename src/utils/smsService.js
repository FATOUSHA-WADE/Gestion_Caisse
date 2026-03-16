/**
 * Service d'envoi de SMS
 * Supporte Orange SMS API (Sénégal)
 */

const ORANGE_SMS_API_KEY = process.env.ORANGE_SMS_API_KEY;
const ORANGE_SMS_API_SECRET = process.env.ORANGE_SMS_API_SECRET;
const ORANGE_SMS_SENDER = process.env.ORANGE_SMS_SENDER || 'GESTICOM';

/**
 * Envoyer un SMS
 * @param {string} phoneNumber - Numéro de téléphone (format: 22177xxx....
 * @param {string} message - Message à envoyer
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendSMS(phoneNumber, message) {
  // En mode développement, simuler l'envoi
  if (process.env.NODE_ENV === 'development' || !ORANGE_SMS_API_KEY || ORANGE_SMS_API_KEY === 'your_api_key') {
    console.log(`[SMS SIMULÉ] Vers ${phoneNumber}: ${message}`);
    return { 
      success: true, 
      messageId: `sim_${Date.now()}`,
      simulated: true 
    };
  }

  try {
    // Formater le numéro de téléphone
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('221')) {
      formattedPhone = '221' + formattedPhone;
    }

    // Appeler l'API Orange SMS
    const response = await fetch('https://api.orange.com/smsmessaging/v1/outbound/tel:' + formattedPhone + '/requests', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + await getOrangeToken(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        outboundSMSMessageRequest: {
          senderAddress: 'tel:' + ORANGE_SMS_SENDER,
          outboundSMSMessageRequest: {
            message: message
          }
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        messageId: data.outboundSMSMessageRequest?.requestId 
      };
    } else {
      const error = await response.text();
      console.error('[SMS ERROR] Orange API error:', error);
      return { 
        success: false, 
        error: 'Erreur lors de l\'envoi du SMS' 
      };
    }
  } catch (error) {
    console.error('[SMS ERROR]', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Obtenir le token d'accès Orange API
 */
async function getOrangeToken() {
  const response = await fetch('https://api.orange.com/oauth/v2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=client_credentials&client_id=${ORANGE_SMS_API_KEY}&client_secret=${ORANGE_SMS_API_SECRET}`
  });

  const data = await response.json();
  return data.access_token;
}

/**
 * Envoyer le code de vérification par SMS
 * @param {string} phoneNumber - Numéro de téléphone
 * @param {string} code - Code de vérification à 6 chiffres
 */
export async function sendVerificationCode(phoneNumber, code) {
  const message = `Votre code de vérification GESTICOM est: ${code}. Ce code expire dans 15 minutes.`;
  return sendSMS(phoneNumber, message);
}
