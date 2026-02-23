import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany();

  const hashedPin = await bcrypt.hash('1234', 10);

  await prisma.user.create({
    data: {
      nom: 'UserAdmin',
      telephone: '771428150',
      email: 'admin@gmail.com',
      codePin: hashedPin,
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
