import { z } from 'zod';
import { VALIDATION_MESSAGES } from './validationMessages.js';
import { isValidSenegalPhoneNumber } from '../utils/phone.utils.js';

const phoneSchema = z.string({
  required_error: VALIDATION_MESSAGES.required,
  invalid_type_error: VALIDATION_MESSAGES.telephone
}).refine(
  (phone) => isValidSenegalPhoneNumber(phone),
  {
    message: VALIDATION_MESSAGES.invalidPhone
  }
);

export const userSchema = z.object({
  nom: z.string({
    required_error: VALIDATION_MESSAGES.nom,
    invalid_type_error: VALIDATION_MESSAGES.string
  }),
  telephone: phoneSchema,
  email: z.string().email(VALIDATION_MESSAGES.email).or(z.literal('').or(z.null())),
  password: z.string({
    required_error: VALIDATION_MESSAGES.required,
    invalid_type_error: VALIDATION_MESSAGES.string
  }).min(6, VALIDATION_MESSAGES.minPassword),
  role: z.enum(['admin', 'gerant', 'caissier'], {
    invalid_type_error: VALIDATION_MESSAGES.role,
    required_error: VALIDATION_MESSAGES.role
  })
});

export function validateUser(req, res, next) {
  try {
    userSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.errors[0]?.message || 'Erreur de validation'
    });
  }
}
