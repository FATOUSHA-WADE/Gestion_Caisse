import categorieService from '../services/categorie.service.js';

class CategorieController {

  async getAll(req, res, next) {
    try {
      const categories = await categorieService.getAll();

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = req.params.id;
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: "Paramètre 'id' manquant ou invalide"
        });
      }
      const categorie = await categorieService.getById(id);
      res.json({
        success: true,
        data: categorie
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { nom, description } = req.body;

      if (!nom) {
        return res.status(400).json({
          success: false,
          message: "Le nom est obligatoire"
        });
      }

      const categorie = await categorieService.create({
        nom,
        description
      });

      res.status(201).json({
        success: true,
        message: "Catégorie créée",
        data: categorie
      });

    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const categorie = await categorieService.update(
        req.params.id,
        req.body
      );

      res.json({
        success: true,
        message: "Catégorie mise à jour",
        data: categorie
      });

    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await categorieService.delete(req.params.id);

      res.json({
        success: true,
        message: "Catégorie supprimée"
      });

    } catch (error) {
      next(error);
    }
  }
}

export default new CategorieController();