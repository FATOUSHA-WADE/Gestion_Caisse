import { z } from 'zod';
import { VALIDATION_MESSAGES } from './validationMessages.js';

export const venteSchema = z.object({
  lignes: z.array(z.object({
    produitId: z.number({ required_error: 'Produit requis' }),
    quantite: z.number({ required_error: 'Quantité requise' }),
    prixUnitaire: z.string({ required_error: 'Prix unitaire requis' })
  })).min(1, 'Au moins une ligne de vente est requise'),
  modePaiement: z.enum(['ESPECES', 'CARTE', 'ORANGE_MONEY', 'WAVE'], {
    required_error: VALIDATION_MESSAGES.modePaiement,
    invalid_type_error: VALIDATION_MESSAGES.modePaiement
  })
});

export function validateVente(req, res, next) {
  try {
    venteSchema.parse(req.body);
    next();
  } catch (error) {
    let message = 'Erreur de validation';
    if (error.errors && Array.isArray(error.errors) && error.errors[0]?.message) {
      message = error.errors[0].message;
    } else if (error.message) {
      message = error.message;
    }
    return res.status(400).json({
      success: false,
      message
    });
  }
}
