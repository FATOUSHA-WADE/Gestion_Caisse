FROM node:20

# Dossier principal
WORKDIR /app

# Copie des fichiers package et prisma
COPY package*.json ./
COPY prisma ./prisma/
COPY .env ./

# Install dependencies
RUN npm install

# Copie du reste du code
COPY . .

# Génère Prisma Client avec DATABASE_URL
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate

EXPOSE 3000

# Au démarrage: lance le serveur
CMD ["node", "server.js"]