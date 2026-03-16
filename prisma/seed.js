import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {

  // Supprimer d'abord les enregistrements dépendants
  await prisma.mouvementStock.deleteMany();
  await prisma.vente.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('admin1234', 10);

  await prisma.user.create({
    data: {
      nom: 'UserAdmin',
      telephone: '771428150',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin',
      statut: 'actif',
    },
  });

  console.log('Utilisateur créé avec succès');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
