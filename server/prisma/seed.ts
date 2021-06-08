import { PrismaClient } from '.prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: `admin@admin.com`,
      name: 'Admin',
      password: 'supersecret',
      roles: ['Admin'],
    },
  });
}

export async function seed() {
  return main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
