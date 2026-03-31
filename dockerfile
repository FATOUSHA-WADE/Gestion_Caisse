FROM node:20

# Dossier principal
WORKDIR /app

# Copie des fichiers package et prisma
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copie du reste du code
COPY . .

# Génère Prisma Client
RUN npx prisma generate

# Variables d'environnement (à configurer dans Render Dashboard)
# SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
# Ces variables doivent être définies dans les paramètres Render

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
