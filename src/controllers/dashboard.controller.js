import dashboardService from '../services/dashboard.service.js';

class DashboardController {

  async stats(req, res, next) {
    try {

      const data = await dashboardService.getStats();

      res.json({
        success: true,
        data
      });

    } catch (error) {
      next(error);
    }
  }

  async chart(req, res, next) {
    try {

      const data = await dashboardService.ventesParJour();

      res.json({
        success: true,
        data
      });

    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();