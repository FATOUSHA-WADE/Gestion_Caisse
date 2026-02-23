FROM node:20

# Dossier principal
WORKDIR /app

# Copie des fichiers package
COPY package*.json ./
RUN npm install

# Copie du reste du code
COPY . .

# Génère Prisma Client
RUN npx prisma generate
# Optionnel : seed la base (à ne faire que si tu veux peupler la base à chaque build)
# RUN npx prisma db seed

EXPOSE 3000

CMD ["node", "server.js"]

