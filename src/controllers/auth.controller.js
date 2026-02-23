
import authService from '../services/auth.service.js';

class AuthController {

  async login(req, res, next) {
    try {
      const { telephone, pin } = req.body;

      if (!telephone || !pin) {
        return res.status(400).json({
          success: false,
          message: "Téléphone et PIN obligatoires"
        });
      }

      const data = await authService.login(telephone, pin);

      res.status(200).json({
        success: true,
        message: "Connexion réussie",
        data
      });

    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
