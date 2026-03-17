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

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
