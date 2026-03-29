import mouvementStockService from '../services/mouvementStock.service.js';

class MouvementStockController {

  async getAll(req, res, next) {
    try {
      const result = await mouvementStockService.getAll(req.query);

      res.json({
        success: true,
        data: result.mouvements,
        meta: result.meta
      });

    } catch (error) {
      next(error);
    }
  }
  async getById(req, res, next) {
    try {
      const mouvement = await mouvementStockService.getById(req.params.id);

      res.json({
        success: true,
        data: mouvement
      });

    } catch (error) {
      next(error);
    }
  }
  async create(req, res, next) {
    try {
      const { produitId, type, quantite, quantiteAvant, quantiteApres, motif } = req.body;

      const mouvement = await mouvementStockService.create({
        produitId,
        userId: req.user.id,
        type,
        quantite,
        quantiteAvant,
        quantiteApres,
        motif
      });

      res.status(201).json({
        success: true,
        message: "Mouvement de stock créé",
        data: mouvement
      });

    } catch (error) {
      next(error);
    }
  }
}
export default new MouvementStockController();
