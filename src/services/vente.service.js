import prisma from '../config/database.js';
import { generateReference } from '../utils/generateReference.js';
import { emitter, EVENTS } from '../config/eventEmitter.js';

class VenteService {

  async createVente(lignes, userId, modePaiement) {

    if (!lignes || lignes.length === 0) {
      const error = new Error("Aucune ligne de vente fournie");
      error.statusCode = 400;
      throw error;
    }

    let venteData = null;
    const result = await prisma.$transaction(async (tx) => {
      let total = 0;
      for (const ligne of lignes) {
        const produit = await tx.produit.findUnique({
          where: { id: Number(ligne.produitId) }
        });
        if (!produit) {
          throw new Error(`Produit ID ${ligne.produitId} introuvable`);
        }
        if (produit.stock < ligne.quantite) {
          const error = new Error(
            `Stock insuffisant pour ${produit.nom} (disponible: ${produit.stock})`
          );
          error.statusCode = 422;
          throw error;
        }
        total += Number(produit.prixVente) * ligne.quantite;
      }
      const vente = await tx.vente.create({
        data: {
          reference: "TEMP",
          userId,
          total,
          modePaiement
        }
      });
      const reference = generateReference(vente.id);
      await tx.vente.update({
        where: { id: vente.id },
        data: { reference }
      });
      for (const ligne of lignes) {
        const produit = await tx.produit.findUnique({
          where: { id: Number(ligne.produitId) }
        });
        const sousTotal = Number(produit.prixVente) * ligne.quantite;
        await tx.ligneVente.create({
          data: {
            venteId: vente.id,
            produitId: produit.id,
            quantite: ligne.quantite,
            prixUnitaire: produit.prixVente,
            sousTotal
          }
        });
        await tx.produit.update({
          where: { id: produit.id },
          data: {
            stock: produit.stock - ligne.quantite
          }
        });
        await tx.mouvementStock.create({
          data: {
            produitId: produit.id,
            userId,
            type: "sortie",
            quantite: ligne.quantite,
            quantiteAvant: produit.stock,
            quantiteApres: produit.stock - ligne.quantite,
            motif: `Vente ${reference}`
          }
        });
      }
      venteData = { ...vente, reference };
      return venteData;
    });
    setImmediate(() => {
      emitter.emit(EVENTS.VENTE_CREEE, { vente: result, lignes });
    });
    return result;
  }
 

  async annulerVente(venteId, userId) {


  let venteAnnulee = null;
  const result = await prisma.$transaction(async (tx) => {
    const vente = await tx.vente.findUnique({
      where: { id: Number(venteId) },
      include: { lignes: true }
    });
    if (!vente) {
      const error = new Error("Vente introuvable");
      error.statusCode = 404;
      throw error;
    }
    if (vente.statut === "annulee") {
      const error = new Error("Vente déjà annulée");
      error.statusCode = 400;
      throw error;
    }
    for (const ligne of vente.lignes) {
      const produit = await tx.produit.findUnique({
        where: { id: ligne.produitId }
      });
      const nouveauStock = produit.stock + ligne.quantite;
      await tx.produit.update({
        where: { id: produit.id },
        data: { stock: nouveauStock }
      });
      await tx.mouvementStock.create({
        data: {
          produitId: produit.id,
          userId,
          type: "entree",
          quantite: ligne.quantite,
          quantiteAvant: produit.stock,
          quantiteApres: nouveauStock,
          motif: `Annulation ${vente.reference}`
        }
      });
    }
    await tx.vente.update({
      where: { id: vente.id },
      data: { statut: "annulee" }
    });
    venteAnnulee = vente;
    return { message: "Vente annulée avec succès" };
  });
  setImmediate(() => {
    emitter.emit(EVENTS.VENTE_ANNULEE, venteAnnulee);
  });
  return result;
 
}
 

  }
  
export default new VenteService();