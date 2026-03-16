import venteService from '../services/vente.service.js';

class VenteController {

  async create(req, res, next) {
    try {

      const { lignes, modePaiement } = req.body;

      const vente = await venteService.createVente(
        lignes,
        req.user.id,
        modePaiement
      );

      res.status(201).json({
        success: true,
        message: "Vente effectuée avec succès",
        data: vente
      });

    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await venteService.getAllVentes(req.query);

      res.json({
        success: true,
        data: result.ventes,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const vente = await venteService.getVenteById(req.params.id);

      if (!vente) {
        return res.status(404).json({
          success: false,
          message: "Vente introuvable"
        });
      }

      res.json({
        success: true,
        data: vente
      });
    } catch (error) {
      next(error);
    }
  }

  async annuler(req, res, next) {
    try {

      const result = await venteService.annulerVente(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      next(error);
    }
  }
}

export default new VenteController();