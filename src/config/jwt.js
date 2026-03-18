import jwt from 'jsonwebtoken';

const generateToken = (payload) => {
  // JWT_EXPIRES_IN doit être un nombre (secondes) ou une chaîne comme "8h", "7d"
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiresIn
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export { generateToken, verifyToken };
