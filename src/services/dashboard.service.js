import prisma from '../config/database.js';

class DashboardService {

  async getStats(periode = 'semaine') {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today);
    let endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    switch (periode) {
      case 'semaine':
        const currentDay = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((currentDay + 6) % 7));
        monday.setHours(0, 0, 0, 0);
        startDate = monday;
        endDate = new Date(monday);
        endDate.setDate(monday.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'mois':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endDate = lastDayOfMonth;
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'annee':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        const dayStart = new Date(today);
        dayStart.setHours(0, 0, 0, 0);
        startDate = dayStart;
    }

    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 💰 CA based on period
    const caPeriode = await prisma.vente.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        statut: "validee"
      }
    });

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

    // 📊 Ventes based on period for chart
    let chartStartDate = new Date(startDate);
    let chartEndDate = new Date(endDate);
    
    if (periode === 'semaine') {
      const currentDay = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((currentDay + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      chartStartDate = monday;
      chartEndDate = new Date(monday);
      chartEndDate.setDate(monday.getDate() + 6);
      chartEndDate.setHours(23, 59, 59, 999);
    } else if (periode === 'mois') {
      chartStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
      chartEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      chartEndDate.setHours(23, 59, 59, 999);
    } else if (periode === 'annee') {
      chartStartDate = new Date(today.getFullYear(), 0, 1);
      chartEndDate = new Date(today.getFullYear(), 11, 31);
      chartEndDate.setHours(23, 59, 59, 999);
    }

    const ventesPeriode = await prisma.$queryRaw`
      SELECT DATE("createdAt" AT TIME ZONE 'Africa/Dakar') as date,
             SUM(total) as total,
             COUNT(*) as "nbVentes"
      FROM "Vente"
      WHERE "createdAt" >= ${chartStartDate} AND "createdAt" <= ${chartEndDate} AND statut = 'validee'
      GROUP BY DATE("createdAt" AT TIME ZONE 'Africa/Dakar')
      ORDER BY date ASC
    `;

    // Formater les dates pour le frontend
    const formattedVentesSemaine = ventesPeriode.map(v => ({
      date: v.date instanceof Date ? v.date.toISOString().slice(0, 10) : String(v.date).slice(0, 10),
      total: Number(v.total || 0),
      nbVentes: Number(v.nbVentes || 0)
    }));

    // 📊 Ventes par catégorie (uniquement les ventes validées)
    const ventesParCategorie = await prisma.$queryRaw`
      SELECT c.nom as categorie, SUM(lv."sousTotal") as total, SUM(lv.quantite) as quantite
      FROM "LigneVente" lv
      JOIN "Vente" v ON lv."venteId" = v.id
      JOIN "Produit" p ON lv."produitId" = p.id
      JOIN "Categorie" c ON p."categorieId" = c.id
      WHERE v.statut = 'validee'
      GROUP BY c.id, c.nom
      ORDER BY total DESC
      LIMIT 6
    `;

    const categoriesDetails = ventesParCategorie.map(item => ({
      categorie: item.categorie || 'Non catégorisé',
      total: Number(item.total || 0),
      quantite: Number(item.quantite || 0)
    }));

    // 📝 Ventes récentes
    const ventesRecentes = await prisma.vente.findMany({
      take: 10,
      where: { statut: "validee" },
      include: {
        user: {
          select: { id: true, nom: true }
        },
        lignes: {
          include: {
            produit: {
              select: { id: true, nom: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 📦 Produits récents (derniers produits ajoutés)
    const produitsRecents = await prisma.produit.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        categorie: {
          select: { id: true, nom: true }
        }
      }
    });

    // 📈 Total des produits
    const totalProduits = await prisma.produit.count({
      where: { statut: 'actif' }
    });

    // 📁 Total des catégories
    const totalCategories = await prisma.categorie.count({
      where: { statut: 'actif' }
    });

    // 👥 Total des utilisateurs
    const totalUsers = await prisma.user.count({
      where: { statut: 'actif' }
    });

    // 💰 CA total (toutes les ventes validées)
    const caTotal = await prisma.vente.aggregate({
      _sum: { total: true },
      where: { statut: 'validee' }
    });

    // 📊 Mouvements de stock récents
    const mouvementsRecents = await prisma.mouvementStock.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        produit: {
          select: { id: true, nom: true }
        },
        user: {
          select: { id: true, nom: true }
        }
      }
    });

    // 💰 Données Caisse - Ventes par utilisateur aujourd'hui
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const ventesParUser = await prisma.vente.groupBy({
      by: ['userId'],
      _sum: { total: true },
      _count: { id: true },
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        statut: 'validee'
      }
    });

    const usersWithSales = await prisma.user.findMany({
      where: { statut: 'actif' },
      select: { id: true, nom: true }
    });

    // Simuler les données de caisse (ouverture/fermeture)
    // Dans une vraie implémentation, ces données viendraient d'un modèle CaisseSession
    const listeVendeurs = usersWithSales.map(user => {
      const userVente = ventesParUser.find(v => v.userId === user.id);
      const totalVentes = Number(userVente?._sum?.total || 0);
      const estimatedOpening = 500000; // Estimation - à remplacer par vraie donnée
      const estimatedClosing = estimatedOpening + totalVentes;

      return {
        id: user.id,
        nom: user.nom,
        montantOuverture: estimatedOpening,
        montantFermeture: estimatedClosing,
        totalVentes: totalVentes,
        statut: totalVentes > 0 ? 'actif' : 'inactif',
        heureFermeture: totalVentes > 0 ? '18:00' : null,
        nbVentes: userVente?._count?.id || 0
      };
    });

    // Calculer le total d'ouverture et fermeture
    const totalOuverture = listeVendeurs.reduce((sum, v) => sum + v.montantOuverture, 0);
    const totalFermeture = listeVendeurs.reduce((sum, v) => sum + v.montantFermeture, 0);

    // 💰 Caisse - Solde actuel = CA du jour
    const montantOuvertureCaisse = totalOuverture;
    const montantFermetureCaisse = totalFermeture;
    const statutCaisse = 'fermee'; // À remplacer par vraie donnée
    const heureFermetureCaisse = '23:59';

    return {
      periode: periode,
      caPeriode: caPeriode._sum.total || 0,
      caJour: caJour._sum.total || 0,
      caMois: caMois._sum.total || 0,
      caTotal: caTotal._sum.total || 0,
      nbVentes,
      totalProduits,
      totalCategories,
      totalUsers,
      stockFaible,
      topProduits: produitsDetails,
      ventesSemaine: formattedVentesSemaine,
      ventesParCategorie: categoriesDetails,
      ventesRecentes: ventesRecentes.map(v => ({
        id: v.id,
        reference: v.reference,
        total: Number(v.total),
        modePaiement: v.modePaiement,
        createdAt: v.createdAt,
        user: v.user,
        lignes: v.lignes
      })),
      produitsRecents: produitsRecents.map(p => ({
        id: p.id,
        nom: p.nom,
        sku: p.sku,
        prixVente: Number(p.prixVente),
        stock: p.stock,
        categorie: p.categorie,
        createdAt: p.createdAt
      })),
      mouvementsRecents: mouvementsRecents.map(m => ({
        id: m.id,
        type: m.type,
        quantite: m.quantite,
        quantiteAvant: m.quantiteAvant,
        quantiteApres: m.quantiteApres,
        motif: m.motif,
        createdAt: m.createdAt,
        produit: m.produit,
        user: m.user
      })),
      // Données Caisse
      montantOuverture: montantOuvertureCaisse,
      montantFermeture: montantFermetureCaisse,
      nombreVendeurs: usersWithSales.length,
      listeVendeurs,
      statutCaisse,
      heureFermetureCaisse
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