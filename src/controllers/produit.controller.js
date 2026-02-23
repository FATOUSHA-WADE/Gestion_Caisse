import produitService from '../services/produit.service.js';

class ProduitController {

  async getAll(req, res, next) {
    try {
      const data = await produitService.getAll(req.query);

      res.json({
        success: true,
        data: data.produits,
        meta: data.meta
      });

    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const produit = await produitService.getById(req.params.id);

      res.json({
        success: true,
        data: produit
      });

    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      let data = req.body;
      if (req.file) {
        // Enregistre le chemin relatif Images/nomOriginal.ext
        data.image = 'Images/' + req.file.originalname;
      }
      // Correction : conversion des champs numériques
      if (data.categorieId) data.categorieId = Number(data.categorieId);
      if (data.prixVente) data.prixVente = Number(data.prixVente);
      if (data.stock) data.stock = Number(data.stock);
      if (data.stockMin) data.stockMin = Number(data.stockMin);
      const produit = await produitService.create(data);
      res.status(201).json({
        success: true,
        message: "Produit créé",
        data: produit
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      let data = req.body;
      if (req.file) {
        data.image = 'Images/' + req.file.originalname;
      }
      // Correction : conversion des champs numériques
      if (data.categorieId) data.categorieId = Number(data.categorieId);
      if (data.prixVente) data.prixVente = Number(data.prixVente);
      if (data.stock) data.stock = Number(data.stock);
      if (data.stockMin) data.stockMin = Number(data.stockMin);
      const produit = await produitService.update(
        req.params.id,
        data
      );
      res.json({
        success: true,
        message: "Produit mis à jour",
        data: produit
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await produitService.delete(req.params.id);

      res.json({
        success: true,
        message: "Produit supprimé"
      });

    } catch (error) {
      next(error);
    }
  }

  async alertes(req, res, next) {
    try {
      const produits = await produitService.getAlertes();

      res.json({
        success: true,
        data: produits
      });

    } catch (error) {
      next(error);
    }
  }
}

export default new ProduitController();