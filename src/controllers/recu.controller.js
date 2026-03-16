import recuService from '../services/recu.service.js';

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
}

export default new RecuController();