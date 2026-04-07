const SENEGAL_COUNTRY_CODE = '+221';
const VALID_LOCAL_PREFIXES = ['77', '78'];
const PHONE_LENGTH = 9;

export function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  let cleaned = phone.replace(/\s|/g, '');
  
  if (cleaned.startsWith(SENEGAL_COUNTRY_CODE)) {
    cleaned = cleaned.substring(SENEGAL_COUNTRY_CODE.length);
  }
  
  if (cleaned.startsWith('221')) {
    cleaned = cleaned.substring(3);
  }
  
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned;
}

export function isValidSenegalPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  const normalized = normalizePhoneNumber(phone);
  
  if (!normalized || normalized.length !== PHONE_LENGTH) {
    return false;
  }
  
  const prefix = normalized.substring(0, 2);
  
  return VALID_LOCAL_PREFIXES.includes(prefix);
}

export function formatPhoneForDisplay(phone) {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return phone;
  
  return normalized;
}

export function validatePhone(phone) {
  if (!isValidSenegalPhoneNumber(phone)) {
    return {
      valid: false,
      message: 'Le numéro de téléphone doit être au format 77XXXXXXX ou 78XXXXXXX (local) ou +22177XXXXXXX/+22178XXXXXXX (international)'
    };
  }
  
  return {
    valid: true,
    normalized: normalizePhoneNumber(phone)
  };
}

export function createPhoneValidator() {
  return z.string().refine(
    (phone) => isValidSenegalPhoneNumber(phone),
    {
      message: 'Le numéro de téléphone doit être au format 77XXXXXXX ou 78XXXXXXX (local) ou +22177XXXXXXX/+22178XXXXXXX (international)'
    }
  );
}