import prisma from '../config/database.js';

class CategorieService {

  async getAll() {
    return await prisma.categorie.findMany({
      orderBy: { createdAt: 'desc' }
    });
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
}

export default new CategorieService();