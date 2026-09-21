import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create a Package
  const elitePackage = await prisma.package.upsert({
    where: { id: 'pkg_elite_1' },
    update: {},
    create: {
      id: 'pkg_elite_1',
      name: 'Elite Panel Access',
      description: 'Lifetime access to the elite panel and resources.',
    },
  });

  // 2. Create Package Resources
  await prisma.packageResource.deleteMany({ where: { packageId: elitePackage.id } }); // Clear existing to prevent duplicates on re-run
  await prisma.packageResource.createMany({
    data: [
      { packageId: elitePackage.id, type: 'download', name: 'MAIN FILE', url: 'https://example.com/download/main-file.zip' },
      { packageId: elitePackage.id, type: 'text', name: 'FILE PASSWORD', secret: 'OBSIDIAN-X992-SECURE' },
      { packageId: elitePackage.id, type: 'download', name: 'MT MANAGER', url: 'https://example.com/download/mt-manager.apk' },
      { packageId: elitePackage.id, type: 'link', name: 'MT MANAGER TUTORIAL', url: 'https://example.com/tutorial-mt' },
      { packageId: elitePackage.id, type: 'download', name: 'SHIZUKU', url: 'https://example.com/download/shizuku.apk' },
      { packageId: elitePackage.id, type: 'link', name: 'SHIZUKU TUTORIAL', url: 'https://example.com/tutorial-shizuku' },
      { packageId: elitePackage.id, type: 'link', name: 'MAIN SETUP TUTORIAL', url: 'https://example.com/tutorial-main' }
    ]
  });

  // 3. Create Products
  const productsToSeed = [
    {
      slug: 'elite-panel-lifetime',
      name: 'MK Panel - Lifetime',
      description: 'The ultimate undetected panel. Lifetime updates included.',
      price: 150.00,
    },
    {
      slug: 'mk-panel-3-months',
      name: 'MK Panel - 3 Months',
      description: '90 days of full access with all updates included.',
      price: 60.00,
    },
    {
      slug: 'mk-panel-monthly',
      name: 'MK Panel - Monthly',
      description: '30 days of full access with updates included.',
      price: 25.00,
    },
    {
      slug: 'mk-panel-weekly',
      name: 'MK Panel - Weekly',
      description: '7 days of access. A short way to try the panel.',
      price: 9.00,
    },
    {
      slug: 'mk-setup-pack',
      name: 'MK Setup Pack',
      description: 'Setup files, tools and guided tutorials in one package.',
      price: 15.00,
    },
    {
      slug: 'mk-priority-support',
      name: 'MK Priority Support',
      description: 'Priority help with setup and troubleshooting.',
      price: 20.00,
    }
  ];

  for (const p of productsToSeed) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: p.price,
        active: true,
      },
    });
  }

  // 4. Create a Payment Method
  await prisma.paymentMethod.createMany({
    data: [
      {
        name: 'Cryptocurrency (BTC/ETH)',
        accountDetails: 'Send to: 0x1234567890abcdef (Contact support for BTC address)'
      },
      {
        name: 'Bank Transfer',
        accountDetails: 'IBAN: DE89 3704 0044 0532 0130 00'
      }
    ]
  });

  // 5. Create a test customer (password: "password123")
  const passwordHash = await argon2.hash('password123');
  await prisma.customer.upsert({
    where: { identifier: 'test_user' },
    update: {},
    create: {
      identifier: 'test_user',
      passwordHash,
      packageId: elitePackage.id,
      platformType: 'ANDROID',
    }
  });

  // 6. Create Owner account
  const ownerPasswordHash = await argon2.hash('admin123');
  await prisma.agent.upsert({
    where: { username: 'owner' },
    update: {},
    create: {
      username: 'owner',
      passwordHash: ownerPasswordHash,
      role: 'OWNER',
    }
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
