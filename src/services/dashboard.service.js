import prisma from '../config/database.js';

class DashboardService {

  async getStats() {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 💰 CA du jour
    const caJour = await prisma.vente.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: today },
        statut: "validee"
      }
    });

    // 💰 CA du mois
    const caMois = await prisma.vente.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: startMonth },
        statut: "validee"
      }
    });

    // 🧾 Nombre de ventes
    const nbVentes = await prisma.vente.count({
      where: { statut: "validee" }
    });

    // 📦 Stock faible (≤ 5)
    const stockFaible = await prisma.produit.findMany({
      where: {
        stock: { lte: 5 }
      },
      select: {
        id: true,
        nom: true,
        stock: true
      }
    });

    // 🏆 Top produits
    const topProduits = await prisma.ligneVente.groupBy({
      by: ['produitId'],
      _sum: { quantite: true },
      orderBy: {
        _sum: { quantite: 'desc' }
      },
      take: 5
    });

    const produitsDetails = await Promise.all(
      topProduits.map(async (item) => {
        const produit = await prisma.produit.findUnique({
          where: { id: item.produitId }
        });

        return {
          nom: produit.nom,
          quantiteVendue: item._sum.quantite
        };
      })
    );

    return {
      caJour: caJour._sum.total || 0,
      caMois: caMois._sum.total || 0,
      nbVentes,
      stockFaible,
      topProduits: produitsDetails
    };
  }

  async ventesParJour() {

    const result = await prisma.$queryRaw`
      SELECT DATE("createdAt") as date,
             SUM(total) as total
      FROM "Vente"
      WHERE statut = 'validee'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    return result;
  }

  async analyserCAJournalier() {

  const today = new Date();
  today.setHours(0,0,0,0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const caJour = await prisma.vente.aggregate({
    _sum: { total: true },
    where: {
      createdAt: { gte: today },
      statut: "validee"
    }
  });

  const caSemaine = await prisma.vente.aggregate({
    _sum: { total: true },
    where: {
      createdAt: { gte: sevenDaysAgo },
      statut: "validee"
    }
  });

  const moyenne = (caSemaine._sum.total || 0) / 7;
  const totalJour = caJour._sum.total || 0;

  return {
    totalJour,
    moyenne,
    variation: moyenne ? ((totalJour - moyenne) / moyenne) * 100 : 0
  };
}
}

export default new DashboardService();