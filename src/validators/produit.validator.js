import { z } from 'zod';
import { VALIDATION_MESSAGES } from './validationMessages.js';


export const produitSchema = z.object({
  nom: z.string({
    required_error: VALIDATION_MESSAGES.produitNom,
    invalid_type_error: VALIDATION_MESSAGES.string
  }),
  prixVente: z.string({
    required_error: VALIDATION_MESSAGES.prixVente
  }).transform((val) => Number(val)).refine(val => !isNaN(val), { message: VALIDATION_MESSAGES.prixVente }),
  categorieId: z.string({
    required_error: VALIDATION_MESSAGES.categorie
  }).transform((val) => Number(val)).refine(val => !isNaN(val), { message: VALIDATION_MESSAGES.categorie }),
  stock: z.string().optional().transform(val => val === undefined ? undefined : Number(val)).refine(val => val === undefined || !isNaN(val), { message: VALIDATION_MESSAGES.stock }),
  image: z.string().optional(),
  stockMin: z.string().optional().transform(val => val === undefined ? undefined : Number(val)).refine(val => val === undefined || !isNaN(val), { message: 'Le stock minimum doit être un nombre' }),
  statut: z.string().optional()
});

export function validateProduit(req, res, next) {
  try {
    // Fusionner req.body et req.file si besoin
    const data = { ...req.body };
    if (req.file) {
      data.image = req.file.path;
    }
    produitSchema.parse(data);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.errors?.[0]?.message || 'Erreur de validation'
    });
  }
}
