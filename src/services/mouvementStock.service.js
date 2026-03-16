import prisma from '../config/database.js';

class MouvementStockService {

  async getAll(query) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {};

    if (query.type) {
      filters.type = query.type;
    }

    if (query.produitId) {
      filters.produitId = Number(query.produitId);
    }

    if (query.dateDebut) {
      filters.createdAt = {
        ...filters.createdAt,
        gte: new Date(query.dateDebut)
      };
    }

    if (query.dateFin) {
      filters.createdAt = {
        ...filters.createdAt,
        lte: new Date(query.dateFin)
      };
    }

    const [mouvements, total] = await Promise.all([
      prisma.mouvementStock.findMany({
        where: filters,
        skip,
        take: limit,
        include: {
          produit: true,
          user: {
            select: { id: true, nom: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.mouvementStock.count({ where: filters })
    ]);

    return {
      mouvements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id) {
    const mouvement = await prisma.mouvementStock.findUnique({
      where: { id: Number(id) },
      include: {
        produit: true,
        user: {
          select: { id: true, nom: true }
        }
      }
    });

    if (!mouvement) {
      const error = new Error("Mouvement de stock introuvable");
      error.statusCode = 404;
      throw error;
    }

    return mouvement;
  }

  async create(data) {
    return await prisma.mouvementStock.create({
      data
    });
  }
}

export default new MouvementStockService();
