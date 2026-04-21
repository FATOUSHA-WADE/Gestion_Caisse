import prisma from '../config/database.js';

class CategorieService {

  async getAll(query) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {};

    if (query.statut) {
      filters.statut = query.statut;
    }

    if (query.nom) {
      filters.nom = {
        contains: query.nom,
        mode: 'insensitive'
      };
    }

    const [categories, total] = await Promise.all([
      prisma.categorie.findMany({
        where: filters,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.categorie.count({ where: filters })
    ]);

    return {
      categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id) {
    const categorie = await prisma.categorie.findUnique({
      where: { id: Number(id) }
    });

    if (!categorie) {
      const error = new Error("Catégorie introuvable");
      error.statusCode = 404;
      throw error;
    }

    return categorie;
  }

  async create(data) {
    return await prisma.categorie.create({
      data
    });
  }

  async update(id, data) {
    await this.getById(id);

    return await prisma.categorie.update({
      where: { id: Number(id) },
      data
    });
  }

  async delete(id) {
    await this.getById(id);

    return await prisma.categorie.delete({
      where: { id: Number(id) }
    });
  }

  async archive(id) {
    await this.getById(id);

    return await prisma.categorie.update({
      where: { id: Number(id) },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        statut: 'inactif'
      }
    });
  }

  async unarchive(id) {
    await this.getById(id);

    return await prisma.categorie.update({
      where: { id: Number(id) },
      data: {
        isArchived: false,
        archivedAt: null,
        statut: 'actif'
      }
    });
  }
}

export default new CategorieService();
