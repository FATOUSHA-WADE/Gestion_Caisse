FROM node:20

# Dossier principal
WORKDIR /app

# Variables d'environnement de build
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
ENV DATABASE_URL=$DATABASE_URL

# Copie des fichiers package et prisma
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copie du reste du code
COPY . .

# Génère Prisma Client
RUN npx prisma generate

EXPOSE 3000

# Au démarrage: lance le serveur
CMD ["node", "server.js"]