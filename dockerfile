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

# Génère Prisma Client et applique les migrations
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "server.js"]
