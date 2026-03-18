import prisma from '../config/database.js';
import { generatePDF } from '../utils/pdfGenerator.js';

class RecuService {

  async genererRecu(venteId) {

    const vente = await prisma.vente.findUnique({
      where: { id: Number(venteId) },
      include: {
        user: true,
        lignes: {
          include: { produit: true }
        }
      }
    });

    if (!vente) {
      throw new Error("Vente introuvable");
    }

    const urlPdf = await generatePDF(vente, vente.lignes);

    const recu = await prisma.recu.create({
      data: {
        venteId: vente.id,
        reference: vente.reference,
        urlPdf
      }
    });

    // Return recu with vente data included
    return {
      ...recu,
      vente: {
        ...vente,
        user: vente.user,
        lignes: vente.lignes
      }
    };
  }

  async getRecu(venteId) {
    const recu = await prisma.recu.findUnique({
      where: { venteId: Number(venteId) },
      include: {
        vente: {
          include: {
            user: true,
            lignes: {
              include: { produit: true }
            }
          }
        }
      }
    });
    
    if (recu) {
      return {
        ...recu,
        total: recu.vente?.total,
        modePaiement: recu.vente?.modePaiement,
        user: recu.vente?.user,
        lignes: recu.vente?.lignes
      };
    }
    return null;
  }
}

export default new RecuService();