import prisma from '../config/database.js';
import { generatePDF } from '../utils/pdfGenerator.js';

class RecuService {

  async genererRecu(venteId) {

    const vente = await prisma.vente.findUnique({
      where: { id: Number(venteId) },
      include: {
        lignes: {
          include: { produit: true }
        }
      }
    });

    if (!vente) {
      throw new Error("Vente introuvable");
    }

    const urlPdf = generatePDF(vente, vente.lignes);

    const recu = await prisma.recu.create({
      data: {
        venteId: vente.id,
        reference: vente.reference,
        urlPdf
      }
    });

    return recu;
  }

  async getRecu(venteId) {
    return await prisma.recu.findUnique({
      where: { venteId: Number(venteId) }
    });
  }
}

export default new RecuService();