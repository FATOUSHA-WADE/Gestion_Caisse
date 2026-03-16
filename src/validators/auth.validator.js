import { z } from 'zod';
import { VALIDATION_MESSAGES } from './validationMessages.js';

export const loginSchema = z.object({
  telephone: z.string({
    required_error: VALIDATION_MESSAGES.required,
    invalid_type_error: VALIDATION_MESSAGES.telephone
  }),
  password: z.string({
    required_error: VALIDATION_MESSAGES.required,
    invalid_type_error: VALIDATION_MESSAGES.string
  }).min(1, VALIDATION_MESSAGES.minPassword)
});

export function validateLogin(req, res, next) {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.errors?.[0]?.message || error.message || 'Erreur de validation'
    });
  }
}
