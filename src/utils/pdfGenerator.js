import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exportsDir = path.join(process.cwd(), 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

function formatCurrency(value) {
  const num = Math.floor(Number(value));
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'F';
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getModeLabel(mode) {
  const labels = { 
    ESPECES: 'Espèces', 
    CARTE: 'Carte Bancaire', 
    ORANGE_MONEY: 'Orange Money', 
    WAVE: 'Wave' 
  };
  return labels[mode] || mode || 'N/A';
}

export const generatePDF = (vente, lignes, parametres = {}) => {
  const fileName = `recu-${vente.reference.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
  const filePath = path.join(exportsDir, fileName);
  
  const headerHeight = 50;
  const itemHeight = 18;
  const footerHeight = 35;
  const extraSpace = 15;
  const pageHeight = headerHeight + (lignes.length * itemHeight) + footerHeight + extraSpace;
  
  const doc = new PDFDocument({ 
    margin: 10, 
    size: [200, Math.max(pageHeight, 250)],
    info: {
      Title: `Reçu ${vente.reference}`,
      Author: 'GESTICOM',
      Subject: 'Reçu de vente'
    }
  });
  
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);
  
  const pageW = 180;
  const centerX = pageW / 2 + 10;
  
  doc.fillColor('#ea580c').rect(0, 0, 200, 40).fill();
  
  let logoLoaded = false;
  if (parametres.logo) {
    try {
      const logoPath = parametres.logo.startsWith('http') 
        ? parametres.logo 
        : path.join(process.cwd(), 'uploads', parametres.logo);
      
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 10, 3, { width: 30, height: 30 });
        doc.fillColor('#ffffff').fontSize(13).text(parametres.nomCommerce || 'GESTICOM', 45, 5, { align: 'left', width: 140 });
        doc.fontSize(6).text(parametres.telephone || '77 142 81 50', 45, 20, { align: 'left', width: 140 });
        logoLoaded = true;
      }
    } catch (e) {
      console.log('[PDF] Logo load error:', e.message);
    }
  }
  
  if (!logoLoaded) {
    doc.fillColor('#ffffff').fontSize(14).text(parametres.nomCommerce || 'GESTICOM', 0, 5, { align: 'center', width: 200 });
    doc.fontSize(7).text('Système de Gestion Commerciale', 0, 20, { align: 'center', width: 200 });
    doc.fontSize(6).text(parametres.telephone || 'Tél: 77 142 81 50', 0, 30, { align: 'center', width: 200 });
  }

  let y = 46;
  doc.fillColor('#f3f4f6').rect(10, y, pageW, 24).fill();
  doc.strokeColor('#e5e7eb').rect(10, y, pageW, 24).stroke();
  
  doc.fillColor('#1f2937').fontSize(7);
  doc.text(`Reçu: ${vente.reference || 'N/A'}`, 13, y + 2);
  doc.text(`Date: ${formatDate(vente.createdAt)}`, 100, y + 2);
  doc.text(`Heure: ${formatTime(vente.createdAt)}`, 13, y + 10);
  doc.text(`Caissier: ${vente.user?.nom || 'N/A'}`, 100, y + 10);
  doc.text(`Mode: ${getModeLabel(vente.modePaiement)}`, 13, y + 18);

  y = 76;
  doc.fillColor('#ea580c').font('Helvetica-Bold').fontSize(8).text('DÉTAILS DES ARTICLES', 13, y);
  y += 8;
  
  doc.fillColor('#6b7b8a').fontSize(6);
  doc.text('Désignation', 13, y);
  doc.text('Qté', 110, y, { width: 18, align: 'center' });
  doc.text('P.U', 130, y, { width: 25, align: 'right' });
  doc.text('Total', 160, y, { width: 25, align: 'right' });
  y += 5;
  doc.strokeColor('#d1d5db').moveTo(12, y).lineTo(188, y).stroke();
  y += 6;

  doc.fillColor('#1f2937').fontSize(7);
  let maxY = y;
  
  lignes.forEach((ligne) => {
    const nom = ligne.produit?.nom || 'Produit';
    const displayNom = nom.length > 22 ? nom.substring(0, 20) + '..' : nom;
    const qte = String(ligne.quantite);
    const prixU = formatCurrency(ligne.prixUnitaire);
    const total = formatCurrency(ligne.sousTotal);
    
    doc.text(displayNom, 13, y);
    doc.text(qte, 110, y, { width: 18, align: 'center' });
    doc.text(prixU, 130, y, { width: 25, align: 'right', lineBreak: false });
    doc.text(total, 160, y, { width: 25, align: 'right', lineBreak: false });
    y += 14;
    maxY = y;
  });

  y = maxY + 8;
  doc.strokeColor('#ea580c').moveTo(12, y).lineTo(188, y).stroke();
  y += 8;
  
  doc.fillColor('#ffffff').rect(10, y - 2, pageW, 16).fill();
  doc.fillColor('#ea580c').font('Helvetica-Bold').fontSize(10).text('TOTAL', 13, y);
  doc.text(formatCurrency(vente.total), 130, y, { width: 35, align: 'right', lineBreak: false });

  if (vente.montantDonne && Number(vente.montantDonne) > 0) {
    y += 16;
    doc.fillColor('#f9fafb').rect(10, y - 2, pageW, 16).fill();
    doc.strokeColor('#e5e7eb').rect(10, y - 2, pageW, 16).stroke();
    
    const montantDonne = formatCurrency(vente.montantDonne);
    const monnaie = Number(vente.montantDonne) - Number(vente.total);
    
    doc.fillColor('#374151').fontSize(7).text('Montant donné:', 13, y);
    doc.text(montantDonne, 130, y, { width: 35, align: 'right', lineBreak: false });
    
    if (monnaie >= 0) {
      doc.fillColor('#059669').font('Helvetica-Bold').fontSize(7).text('Monnaie:', 13, y + 8);
      doc.text(formatCurrency(monnaie), 130, y + 8, { width: 35, align: 'right', lineBreak: false });
    }
    y += 20;
  } else {
    y += 12;
  }

  doc.strokeColor('#ea580c').moveTo(30, y).lineTo(170, y).stroke();
  y += 8;
  doc.fillColor('#6b7b8a').fontSize(7).text('Merci de votre confiance!', 0, y, { align: 'center', width: 200 });

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      resolve(filePath);
    });
    writeStream.on('error', reject);
  });
};