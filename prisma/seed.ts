import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
    },
  });

  // Create sample posts
  await prisma.post.upsert({
    where: { id: 'sample-post-1' },
    update: {},
    create: {
      id: 'sample-post-1',
      title: 'Getting Started with Express and Prisma',
      content: 'This is a sample post about building APIs with Express and Prisma.',
      published: true,
      authorId: user1.id,
    },
  });

  await prisma.post.upsert({
    where: { id: 'sample-post-2' },
    update: {},
    create: {
      id: 'sample-post-2',
      title: 'TypeScript Best Practices',
      content: 'Learn about TypeScript best practices for backend development.',
      published: false,
      authorId: user2.id,
    },
  });

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
