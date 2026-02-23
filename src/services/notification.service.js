import prisma from '../config/database.js';

export const NOTIF_TYPE = {
  STOCK_FAIBLE: "stock_faible",
  STOCK_RUPTURE: "stock_rupture",
  VENTE_ANNULEE: "vente_annulee",
  USER_CREE: "user_cree",
  RAPPORT_CA: "rapport_ca"
};

class NotificationService {

  async creer({ userId, type, titre, message, lienId = null, lienType = null }) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        titre,
        message,
        lienId,
        lienType,
        lu: false
      }
    });
  }

  async getParUser(userId, { lu = null, page = 1, limit = 20 }) {

    const where = {
      userId,
      ...(lu !== null && { lu })
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    return {
      notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async compterNonLues(userId) {
    return prisma.notification.count({
      where: { userId, lu: false }
    });
  }

  async marquerLue(id, userId) {
    const notif = await prisma.notification.findFirst({
      where: { id: Number(id), userId }
    });

    if (!notif) {
      const error = new Error("Notification introuvable");
      error.statusCode = 404;
      throw error;
    }

    return prisma.notification.update({
      where: { id: notif.id },
      data: { lu: true }
    });
  }

  async marquerToutesLues(userId) {
    return prisma.notification.updateMany({
      where: { userId, lu: false },
      data: { lu: true }
    });
  }
  async existeNonLue(userId, type, lienId) {

  const notif = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      lienId,
      lu: false
    }
  });

  return !!notif;
}
}

export default new NotificationService();