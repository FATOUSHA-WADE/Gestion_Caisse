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

      if (parametres) {
        // Update existing
        parametres = await prisma.parametre.update({
          where: { id: parametres.id },
          data: {
            ...(nomCommerce && { nomCommerce }),
            ...(adresse !== undefined && { adresse }),
            ...(telephone !== undefined && { telephone }),
            ...(email !== undefined && { email }),
            ...(devise && { devise }),
            ...(tauxTva !== undefined && { tauxTva: parseFloat(tauxTva) }),
            ...(messagePiedRecu !== undefined && { messagePiedRecu }),
            ...(logoValue && { logo: logoValue }),
            ...(couleurPrincipale && { couleurPrincipale }),
            ...(modesPaiement && { modesPaiement }),
            ...(alertesStock !== undefined && { alertesStock }),
            ...(generationRecuAuto !== undefined && { generationRecuAuto }),
            ...(langue && { langue }),
            ...(sessionsSimultanees !== undefined && { sessionsSimultanees: parseInt(sessionsSimultanees) }),
            ...(requirePasswordChange !== undefined && { requirePasswordChange }),
            ...(dureeSession !== undefined && { dureeSession: parseInt(dureeSession) })
          }
        });
      } else {
        // Create new
        parametres = await prisma.parametre.create({
          data: {
            nomCommerce: nomCommerce || "GESTICOM",
            adresse,
            telephone,
            email,
            devise: devise || "FCFA",
            tauxTva: tauxTva ? parseFloat(tauxTva) : 0,
            messagePiedRecu,
            logo: logoValue,
            couleurPrincipale: couleurPrincipale || "#f97316",
            modesPaiement: modesPaiement || ["ESPECES", "CARTE", "ORANGE_MONEY", "WAVE"],
            alertesStock: alertesStock ?? true,
            generationRecuAuto: generationRecuAuto ?? true,
            langue: langue || "fr",
            sessionsSimultanees: sessionsSimultanees ? parseInt(sessionsSimultanees) : 1,
            requirePasswordChange: requirePasswordChange ?? false,
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
      next(error);
    }
  }
}

export default new ParametreController();
