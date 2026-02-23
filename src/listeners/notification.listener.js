import { emitter, EVENTS } from '../config/eventEmitter.js';
import notificationService, { NOTIF_TYPE } from '../services/notification.service.js';
import prisma from '../config/database.js';
import SSEManager from '../config/sseManager.js';
import { BUSINESS_RULES } from '../config/businessRules.js';
import dashboardService from '../services/dashboard.service.js';

emitter.on(EVENTS.VENTE_ANNULEE, async (vente) => {

  try {

    const admins = await prisma.user.findMany({
      where: { role: 'admin' }
    });

    for (const admin of admins) {

      const notif = await notificationService.creer({
        userId: admin.id,
        type: NOTIF_TYPE.VENTE_ANNULEE,
        titre: "Vente annulée",
        message: `La vente ${vente.reference} a été annulée.`,
        lienId: vente.id,
        lienType: "vente"
      });

      // 🔥 ENVOI TEMPS RÉEL
      SSEManager.send(admin.id, {
        type: "notification",
        data: notif
      });
    }

  } catch (error) {
    console.error("Erreur notification SSE:", error.message);
  }

});

emitter.on(EVENTS.VENTE_CREEE, async ({ vente, lignes }) => {

  try {

    // 1️⃣ Récupérer admins + gérants actifs
    const responsables = await prisma.user.findMany({
      where: {
        role: { in: ['admin', 'gerant'] },
        statut: 'actif'
      }
    });

    for (const ligne of lignes) {

      const produit = await prisma.produit.findUnique({
        where: { id: ligne.produitId }
      });

      if (!produit) continue;

      // 🔴 RUPTURE
      if (produit.stock === 0) {

        for (const user of responsables) {

          const notif = await notificationService.creer({
            userId: user.id,
            type: NOTIF_TYPE.STOCK_RUPTURE,
            titre: `Rupture de stock`,
            message: `${produit.nom} est épuisé.`,
            lienId: produit.id,
            lienType: "produit"
          });

          SSEManager.send(user.id, {
            type: "notification",
            data: notif
          });
        }
      }

      // 🟠 STOCK FAIBLE
      else if (produit.stock <= produit.stockMin) {

        for (const user of responsables) {

          const notif = await notificationService.creer({
            userId: user.id,
            type: NOTIF_TYPE.STOCK_FAIBLE,
            titre: `Stock faible`,
            message: `${produit.nom} : ${produit.stock} restants (min: ${produit.stockMin})`,
            lienId: produit.id,
            lienType: "produit"
          });

          SSEManager.send(user.id, {
            type: "notification",
            data: notif
          });
        }
      }
    }

  } catch (error) {
    console.error("Erreur alertes stock:", error.message);
  }
if (vente.total >= BUSINESS_RULES.SEUIL_GRANDE_VENTE) {

  const responsables = await prisma.user.findMany({
    where: {
      role: { in: ['admin', 'gerant'] },
      statut: 'actif'
    }
  });

  for (const user of responsables) {

    const notif = await notificationService.creer({
      userId: user.id,
      type: NOTIF_TYPE.RAPPORT_CA,
      titre: "Grande vente enregistrée",
      message: `Vente ${vente.reference} : ${vente.total} FCFA (${vente.modePaiement})`,
      lienId: vente.id,
      lienType: "vente"
    });

    SSEManager.send(user.id, {
      type: "notification",
      data: notif
    });
  }
}

});

// Bloc supprimé : 'user' n'est pas défini dans ce contexte
export const verifierCAJournalier = async () => {

  const analyse = await dashboardService.analyserCAJournalier();

  const responsables = await prisma.user.findMany({
    where: {
      role: { in: ['admin', 'gerant'] },
      statut: 'actif'
    }
  });

  // 📈 Bonne journée
  if (analyse.variation >= 40) {

    for (const user of responsables) {

      const notif = await notificationService.creer({
        userId: user.id,
        type: NOTIF_TYPE.RAPPORT_CA,
        titre: "Excellente journée 📈",
        message: `CA : ${analyse.totalJour} FCFA (+${analyse.variation.toFixed(1)}%)`,
        lienType: "dashboard"
      });

      SSEManager.send(user.id, {
        type: "notification",
        data: notif
      });
    }
  }

  // 📉 Journée faible
  if (analyse.totalJour <= BUSINESS_RULES.SEUIL_CA_JOUR_FAIBLE) {

    for (const user of responsables) {

      const notif = await notificationService.creer({
        userId: user.id,
        type: NOTIF_TYPE.RAPPORT_CA,
        titre: "Journée faible 📉",
        message: `CA faible : ${analyse.totalJour} FCFA`,
        lienType: "dashboard"
      });

      SSEManager.send(user.id, {
        type: "notification",
        data: notif
      });
    }
  }
};