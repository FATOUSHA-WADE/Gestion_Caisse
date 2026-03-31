
import prisma from '../config/database.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../config/jwt.js';

class AuthService {

  async login(telephone, password) {
    const user = await prisma.user.findUnique({
      where: { telephone }
    });

    if (!user || user.statut === 'inactif') {
      const error = new Error("Identifiants incorrects");
      error.statusCode = 401;
      throw error;
    }

    const passwordValide = await bcrypt.compare(password, user.password);

    if (!passwordValide) {
      const error = new Error("Mot de passe incorrect");
      error.statusCode = 401;
      throw error;
    }

    const token = generateToken({
      id: user.id,
      role: user.role,
      nom: user.nom
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { derniereConnexion: new Date() }
    });

    return {
      token,
      user: {
        id: user.id,
        nom: user.nom,
        telephone: user.telephone,
        email: user.email,
        role: user.role,
        photo: user.photo ? `${process.env.API_BASE_URL || 'http://localhost:3000'}/uploads/${user.photo}` : null
      }
    };
  }
}

export default new AuthService();
