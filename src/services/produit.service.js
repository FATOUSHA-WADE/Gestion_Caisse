import prisma from '../config/database.js';

class ProduitService {

  async getAll(query) {

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {};

    if (query.nom) {
      filters.nom = {
        contains: query.nom,
        mode: 'insensitive'
      };
    }

    if (query.statut) {
      filters.statut = query.statut;
    }

    if (query.categorieId) {
      filters.categorieId = Number(query.categorieId);
    }

    const [produits, total] = await Promise.all([
      prisma.produit.findMany({
        where: filters,
        skip,
        take: limit,
        include: { categorie: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.produit.count({ where: filters })
    ]);

    return {
      produits,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id) {
    const produit = await prisma.produit.findUnique({
      where: { id: Number(id) },
      include: { categorie: true }
    });

    if (!produit) {
      const error = new Error("Produit introuvable");
      error.statusCode = 404;
      throw error;
    }

    return produit;
  }

  async create(data) {
    return await prisma.produit.create({
      data
    });
  }

  async update(id, data) {
    return await prisma.produit.update({
      where: { id: Number(id) },
      data
    });
  }

  async delete(id) {
    return await prisma.produit.delete({
      where: { id: Number(id) }
    });
  }

  async getAlertes() {
    return await prisma.produit.findMany({
      where: {
        OR: [
          { stock: { lte: prisma.produit.fields.stockMin } },
          { statut: 'epuise' }
        ]
      }
    });
  }
}

export default new ProduitService();