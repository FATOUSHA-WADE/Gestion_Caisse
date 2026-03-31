import prisma from '../config/database.js';

class ParametreController {
  // Get settings
  async get(req, res, next) {
    try {
      let parametres = await prisma.parametre.findFirst();
      
      // If no settings exist, create default
      if (!parametres) {
        parametres = await prisma.parametre.create({
          data: {
            nomCommerce: "GESTICOM",
            devise: "FCFA",
            tauxTva: 0,
            messagePiedRecu: "Merci de votre visite ! À bientôt.",
            couleurPrincipale: "#f97316",
            modesPaiement: ["ESPECES", "CARTE", "ORANGE_MONEY", "WAVE"],
            alertesStock: true,
            generationRecuAuto: true,
            langue: "fr",
            sessionsSimultanees: 1,
            requirePasswordChange: false,
            dureeSession: 30
          }
        });
      }
      
      // Add full logo URL if logo exists
      if (parametres.logo) {
        const baseUrl = process.env.API_BASE_URL || 'https://gestion-caisse.onrender.com';
        parametres.logo = parametres.logo.startsWith('http')
          ? parametres.logo
          : `${baseUrl}/uploads/${parametres.logo}`;
      }
      
      res.json({ success: true, data: parametres });
    } catch (error) {
      next(error);
    }
  }

  // Update settings
  async update(req, res, next) {
    try {
      const {
        nomCommerce,
        adresse,
        telephone,
        email,
        devise,
        tauxTva,
        messagePiedRecu,
        logo,
        couleurPrincipale,
        modesPaiement,
        alertesStock,
        generationRecuAuto,
        langue,
        sessionsSimultanees,
        requirePasswordChange,
        dureeSession
      } = req.body;

      // Get existing settings
      let parametres = await prisma.parametre.findFirst();
      
      // Handle logo upload
      let logoValue = logo;
      if (req.file) {
        logoValue = req.file.filename;
      }

      // Parse modesPaiement if it's a string (JSON)
      let parsedModesPaiement = modesPaiement;
      if (typeof modesPaiement === 'string') {
        try {
          parsedModesPaiement = JSON.parse(modesPaiement);
        } catch (e) {
          parsedModesPaiement = ["ESPECES", "CARTE", "ORANGE_MONEY", "WAVE"];
        }
      }

      if (parametres) {
        // Update existing with more robust field handling
        const updateData = {};
        if (nomCommerce !== undefined) updateData.nomCommerce = nomCommerce;
        if (adresse !== undefined) updateData.adresse = adresse || null;
        if (telephone !== undefined) updateData.telephone = telephone || null;
        if (email !== undefined) updateData.email = email || null;
        if (devise !== undefined) updateData.devise = devise || 'FCFA';
        if (tauxTva !== undefined) updateData.tauxTva = parseFloat(tauxTva) || 0;
        if (messagePiedRecu !== undefined) updateData.messagePiedRecu = messagePiedRecu || null;
        if (logoValue !== undefined) updateData.logo = logoValue;
        if (couleurPrincipale !== undefined) updateData.couleurPrincipale = couleurPrincipale || '#f97316';
        if (parsedModesPaiement !== undefined) updateData.modesPaiement = parsedModesPaiement;
        if (alertesStock !== undefined) updateData.alertesStock = alertesStock === 'true' || alertesStock === true;
        if (generationRecuAuto !== undefined) updateData.generationRecuAuto = generationRecuAuto === 'true' || generationRecuAuto === true;
        if (langue !== undefined) updateData.langue = langue || 'fr';
        if (sessionsSimultanees !== undefined) updateData.sessionsSimultanees = parseInt(sessionsSimultanees) || 1;
        if (requirePasswordChange !== undefined) updateData.requirePasswordChange = requirePasswordChange === 'true' || requirePasswordChange === true;
        if (dureeSession !== undefined) updateData.dureeSession = parseInt(dureeSession) || 30;

        parametres = await prisma.parametre.update({
          where: { id: parametres.id },
          data: updateData
        });
      } else {
        // Create new
        parametres = await prisma.parametre.create({
          data: {
            nomCommerce: nomCommerce || "GESTICOM",
            adresse: adresse || null,
            telephone: telephone || null,
            email: email || null,
            devise: devise || "FCFA",
            tauxTva: tauxTva ? parseFloat(tauxTva) : 0,
            messagePiedRecu: messagePiedRecu || "Merci de votre visite ! À bientôt.",
            logo: logoValue || null,
            couleurPrincipale: couleurPrincipale || "#f97316",
            modesPaiement: parsedModesPaiement || ["ESPECES", "CARTE", "ORANGE_MONEY", "WAVE"],
            alertesStock: alertesStock === 'true' || alertesStock === true || true,
            generationRecuAuto: generationRecuAuto === 'true' || generationRecuAuto === true || true,
            langue: langue || "fr",
            sessionsSimultanees: sessionsSimultanees ? parseInt(sessionsSimultanees) : 1,
            requirePasswordChange: requirePasswordChange === 'true' || requirePasswordChange === true || false,
            dureeSession: dureeSession ? parseInt(dureeSession) : 30
          }
        });
      }
      
      // Add full logo URL if logo exists
      if (parametres.logo) {
        const baseUrl = process.env.API_BASE_URL || 'https://gestion-caisse.onrender.com';
        parametres.logo = parametres.logo.startsWith('http')
          ? parametres.logo
          : `${baseUrl}/uploads/${parametres.logo}`;
      }
      
      res.json({ success: true, message: "Paramètres mis à jour", data: parametres });
    } catch (error) {
      console.error('[Parametre] Error updating:', error);
      next(error);
    }
  }
}

export default new ParametreController();
