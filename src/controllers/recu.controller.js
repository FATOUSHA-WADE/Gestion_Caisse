import recuService from '../services/recu.service.js';

class RecuController {

  async get(req, res, next) {
    try {

      const recu = await recuService.getRecu(req.params.venteId);

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