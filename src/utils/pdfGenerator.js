import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generatePDF = (vente, lignes) => {

  const filePath = path.join("exports", `recu-${vente.reference}.pdf`);

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text("REÇU DE VENTE", { align: 'center' });
  doc.moveDown();

  doc.text(`Référence : ${vente.reference}`);
  doc.text(`Date : ${new Date().toLocaleString()}`);
  doc.moveDown();

  lignes.forEach(ligne => {
    doc.text(
      `${ligne.produit.nom} x${ligne.quantite} - ${ligne.sousTotal} FCFA`
    );
  });

  doc.moveDown();
  doc.text(`TOTAL : ${vente.total} FCFA`, { align: 'right' });

  doc.end();

  return filePath;
};