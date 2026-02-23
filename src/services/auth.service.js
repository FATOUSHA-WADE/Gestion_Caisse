
import prisma from '../config/database.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../config/jwt.js';

class AuthService {

  async login(telephone, pin) {

    const user = await prisma.user.findUnique({
      where: { telephone }
    });

    if (!user || user.statut === 'inactif') {
      const error = new Error("Identifiants incorrects");
      error.statusCode = 401;
      throw error;
    }

    const pinValide = await bcrypt.compare(pin, user.codePin);

    if (!pinValide) {
      const error = new Error("PIN incorrect");
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
        role: user.role
      }
    };
  }
}

export default new AuthService();
