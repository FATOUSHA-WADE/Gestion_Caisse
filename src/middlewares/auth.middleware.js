
import { verifyToken } from '../config/jwt.js';

const authMiddleware = (req, res, next) => {

  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({
      success: false,
      message: "Token manquant"
    });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token invalide ou expiré"
    });
  }
};

export default authMiddleware;
