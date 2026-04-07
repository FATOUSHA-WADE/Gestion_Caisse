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
      const data = {
        ...req.body,
        ...(req.file && { image: 'images/' + req.file.originalname }),
        categorieId: req.body.categorieId ? Number(req.body.categorieId) : undefined,
        prixVente: req.body.prixVente ? Number(req.body.prixVente) : undefined,
        stock: req.body.stock ? Number(req.body.stock) : undefined,
        stockMin: req.body.stockMin ? Number(req.body.stockMin) : undefined
      };
      const produit = await produitService.create(data);
      res.status(201).json({
        success: true,
        message: 'Produit créé',
        data: produit
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = {
        ...req.body,
        ...(req.file && { image: 'images/' + req.file.originalname }),
        categorieId: req.body.categorieId ? Number(req.body.categorieId) : undefined,
        prixVente: req.body.prixVente ? Number(req.body.prixVente) : undefined,
        stock: req.body.stock ? Number(req.body.stock) : undefined,
        stockMin: req.body.stockMin ? Number(req.body.stockMin) : undefined
      };
      const produit = await produitService.update(req.params.id, data);
      res.json({
        success: true,
        message: 'Produit mis à jour',
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