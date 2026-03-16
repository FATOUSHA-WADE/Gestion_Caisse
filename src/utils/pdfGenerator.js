

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

function formatDateLong(date) {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: '2-digit'
  }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export const generatePDF = (vente, lignes) => {
  const filePath = path.join('exports', `recu-${vente.reference}.pdf`);
  // Height is dynamic: base + lines + footer
  const doc = new PDFDocument({ margin: 18, size: [320, 370 + lignes.length * 18] });
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Logo (optional: replace with your logo path if available)
  const logoPath = path.join(process.cwd(), 'public', 'docs', 'logo-caisse.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 30, 18, { width: 32, height: 32 });
  }

  // Business name and info
  doc.font('Helvetica-Bold').fontSize(20).text('GESTICOM', 70, 20, { align: 'left' });
  doc.font('Helvetica').fontSize(10).fillColor('#444').text('Système de Gestion Commerciale', 0, 45, { align: 'center' });
  doc.text('Tél: +221 77 142 81 50', { align: 'center' });
  doc.text('Dakar, Sénégal', { align: 'center' });
  doc.moveDown(0.5);

  // Info block
  doc.font('Helvetica').fontSize(10).fillColor('#000');
  const startY = doc.y;
  doc.text(`N° Reçu:`, 18, startY, { continued: true });
  doc.font('Helvetica-Bold').text(`V- ${vente.reference?.split('-').pop() || '----'}`);
  doc.font('Helvetica').text(`Date:`, 18, doc.y, { continued: true });
  doc.font('Helvetica-Bold').text(formatDateLong(vente.createdAt || new Date()), 90, undefined);
  doc.font('Helvetica').text(`Caissier:`, 18, doc.y, { continued: true });
  doc.font('Helvetica-Bold').text(vente.user?.nom || 'N/A', 90, undefined);
  doc.font('Helvetica').text(`Mode:`, 18, doc.y, { continued: true });
  doc.font('Helvetica-Bold').text(vente.modePaiement || 'N/A', 90, undefined);

  // Section: ARTICLES
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(11).text('ARTICLES', 18, doc.y);
  doc.moveTo(18, doc.y + 2).lineTo(300, doc.y + 2).strokeColor('#bbb').stroke();
  doc.moveDown(0.5);

  // Table header (hidden, as in image)
  // Table rows
  doc.font('Helvetica').fontSize(10);
  lignes.forEach(ligne => {
    doc.text(`${ligne.produit.nom} x${ligne.quantite}`, 24, doc.y, { continued: true });
    doc.text(`${Number(ligne.sousTotal).toLocaleString('fr-FR')} FCFA`, 0, doc.y, { align: 'right' });
  });

  // Section: TOTAL
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(13).text('TOTAL', 18, doc.y, { continued: true });
  doc.text(`${Number(vente.total).toLocaleString('fr-FR')} FCFA`, 0, doc.y, { align: 'right' });

  // Footer
  doc.moveDown(1.5);
  doc.font('Helvetica').fontSize(10).fillColor('#888').text('Merci de votre visite !', { align: 'center' });
  doc.font('Helvetica-Oblique').fontSize(13).text('🙏 À bientôt', { align: 'center' });

  doc.end();

  // Wait for the stream to finish before returning
  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      resolve(filePath);
    });
    writeStream.on('error', reject);
  });
};