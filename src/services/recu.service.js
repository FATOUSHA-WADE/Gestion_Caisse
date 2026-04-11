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

    const parametres = await prisma.parametre.findFirst();
    const urlPdf = await generatePDF(vente, vente.lignes, parametres);

    const recu = await prisma.recu.create({
      data: {
        venteId: vente.id,
        reference: vente.reference,
        urlPdf
      }
    });

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
    const vente = await prisma.vente.findUnique({
      where: { id: Number(venteId) },
      include: {
        user: true,
        lignes: {
          include: { produit: true }
        }
      }
    });
    
    if (!vente) return null;
    
    const parametres = await prisma.parametre.findFirst();
    const urlPdf = await generatePDF(vente, vente.lignes, parametres);
    
    await prisma.recu.upsert({
      where: { venteId: Number(venteId) },
      update: { urlPdf, reference: vente.reference },
      create: { venteId: vente.id, reference: vente.reference, urlPdf }
    });
    
    return {
      id: vente.id,
      venteId: vente.id,
      reference: vente.reference,
      urlPdf,
      total: vente.total,
      modePaiement: vente.modePaiement,
      user: vente.user,
      lignes: vente.lignes
    };
  }
}

export default new RecuService();