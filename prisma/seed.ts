import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create ADMIN user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@zorvyn.com' },
    update: {},
    create: {
      id: '5dc7ac90-c08b-4be4-a9aa-32d83cfbec28',
      email: 'admin@zorvyn.com',
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`  ✅ Admin: ${admin.id} (${admin.email})`);

  // Create ANALYST user
  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@zorvyn.com' },
    update: {},
    create: {
      id: '4e3013bb-51e8-4a53-8fd2-c010882c2df5',
      email: 'analyst@zorvyn.com',
      name: 'Jane Analyst',
      role: 'ANALYST',
      isActive: true,
    },
  });
  console.log(`  ✅ Analyst: ${analyst.id} (${analyst.email})`);

  // Create VIEWER user
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@zorvyn.com' },
    update: {},
    create: {
      id: 'c7f1e39b-7cf9-4d92-a783-924a657a319e',
      email: 'viewer@zorvyn.com',
      name: 'Bob Viewer',
      role: 'VIEWER',
      isActive: true,
    },
  });
  console.log(`  ✅ Viewer: ${viewer.id} (${viewer.email})`);

  // Create sample financial records
  const records = [
    { amount: 5000, type: 'INCOME' as const, category: 'Salary', date: new Date('2026-01-15'), notes: 'January salary', userId: admin.id },
    { amount: 1200, type: 'EXPENSE' as const, category: 'Rent', date: new Date('2026-01-01'), notes: 'Monthly rent', userId: admin.id },
    { amount: 800, type: 'EXPENSE' as const, category: 'Software', date: new Date('2026-01-10'), notes: 'IDE license', userId: admin.id },
    { amount: 5500, type: 'INCOME' as const, category: 'Salary', date: new Date('2026-02-15'), notes: 'February salary', userId: admin.id },
    { amount: 1200, type: 'EXPENSE' as const, category: 'Rent', date: new Date('2026-02-01'), notes: 'Monthly rent', userId: admin.id },
    { amount: 350, type: 'EXPENSE' as const, category: 'Travel', date: new Date('2026-02-20'), notes: 'Client visit', userId: admin.id },
    { amount: 6000, type: 'INCOME' as const, category: 'Salary', date: new Date('2026-03-15'), notes: 'March salary', userId: admin.id },
    { amount: 1200, type: 'EXPENSE' as const, category: 'Rent', date: new Date('2026-03-01'), notes: 'Monthly rent', userId: admin.id },
    { amount: 150, type: 'EXPENSE' as const, category: 'Utilities', date: new Date('2026-03-05'), notes: 'Electric bill', userId: admin.id },
    { amount: 2000, type: 'INCOME' as const, category: 'Freelance', date: new Date('2026-03-25'), notes: 'Side project', userId: admin.id },
    { amount: 5000, type: 'INCOME' as const, category: 'Salary', date: new Date('2026-04-01'), notes: 'April salary', userId: admin.id },
    { amount: 450, type: 'EXPENSE' as const, category: 'Food', date: new Date('2026-04-02'), notes: 'Team lunch', userId: admin.id },
  ];

  for (const record of records) {
    await prisma.record.create({ data: record });
  }
  console.log(`  ✅ Created ${records.length} financial records`);

  console.log('\n🎉 Seed complete!');
  console.log(`\n📋 Use these IDs to test:`);
  console.log(`   ADMIN:   ${admin.id}`);
  console.log(`   ANALYST: ${analyst.id}`);
  console.log(`   VIEWER:  ${viewer.id}`);

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
