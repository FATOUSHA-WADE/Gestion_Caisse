FROM node:20

# Dossier principal
WORKDIR /app

# Copie des fichiers package et prisma
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.js ./

# Install dependencies
RUN npm install

# Copie du reste du code
COPY . .

# Génère Prisma Client (n'exécute PAS migrate ici - sera fait au démarrage)
RUN npx prisma generate

EXPOSE 3000

# Au démarrage: migrate puis lance le serveur
CMD ["node", "server.js"]
