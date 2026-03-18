import recuService from '../services/recu.service.js';
import path from 'path';
import fs from 'fs';

class RecuController {

  async get(req, res, next) {
    try {
      // Try to get existing recu, if not found, generate a new one
      let recu = await recuService.getRecu(req.params.venteId);
      
      if (!recu) {
        // Generate a new recu if it doesn't exist
        recu = await recuService.genererRecu(req.params.venteId);
      }

      res.json({
        success: true,
        data: recu
      });

    } catch (error) {
      next(error);
    }
  }

  async downloadPdf(req, res, next) {
    try {
      const recu = await recuService.getRecu(req.params.venteId);
      
      if (!recu || !recu.urlPdf) {
        return res.status(404).json({
          success: false,
          message: "Reçu introuvable"
        });
      }

      const filePath = path.resolve(recu.urlPdf);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "Fichier PDF introuvable"
        });
      }

      res.download(filePath, `recu-${recu.reference}.pdf`);

    } catch (error) {
      next(error);
    }
  }
}

export default new RecuController();