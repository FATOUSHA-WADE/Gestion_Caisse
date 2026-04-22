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

# Génère Prisma Client au build (sans DATABASE_URL, juste pour que le build passe)
RUN DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres npx prisma generate

EXPOSE 3000

# Au démarrage: lance le serveur (Render définit DATABASE_URL)
CMD ["node", "server.js"]