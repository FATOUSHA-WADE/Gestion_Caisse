import notificationService from '../services/notification.service.js';

class NotificationController {

  async getMesNotifications(req, res, next) {
    try {

      const { lu, page, limit } = req.query;

      const luBool =
        lu === "true" ? true :
        lu === "false" ? false :
        null;

      const result = await notificationService.getParUser(
        req.user.id,
        {
          lu: luBool,
          page: Number(page) || 1,
          limit: Number(limit) || 20
        }
      );

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      next(error);
    }
  }

  async getCount(req, res, next) {
    try {

      const count = await notificationService.compterNonLues(req.user.id);

      res.json({
        success: true,
        data: { nonLues: count }
      });

    } catch (error) {
      next(error);
    }
  }

  async marquerLue(req, res, next) {
    try {

      const notif = await notificationService.marquerLue(
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        message: "Notification marquée comme lue",
        data: notif
      });

    } catch (error) {
      next(error);
    }
  }

  async marquerToutesLues(req, res, next) {
    try {

      await notificationService.marquerToutesLues(req.user.id);

      res.json({
        success: true,
        message: "Toutes les notifications marquées comme lues"
      });

    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();