import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding more sample products to fill the grid...');
  
  await prisma.product.createMany({
    data: [
      {
        name: 'MK ANDROID LIFETIME',
        slug: 'mk-android-lifetime-2',
        description: 'Permanent access to MK Android Panel. One-time payment.',
        price: 2999,
        active: true,
        coverImageUrl: 'https://cdn-icons-png.flaticon.com/512/174/174836.png', // Android logo
      },
      {
        name: 'MK IOS MONTHLY',
        slug: 'mk-ios-monthly-2',
        description: '30-days subscription for iOS devices.',
        price: 599,
        active: true,
        coverImageUrl: 'https://cdn-icons-png.flaticon.com/512/0/747.png', // Apple logo
      },
      {
        name: 'MK VIP CONFIG',
        slug: 'mk-vip-config',
        description: 'Exclusive VIP configurations for advanced users.',
        price: 1999,
        active: true,
        coverImageUrl: 'https://cdn-icons-png.flaticon.com/512/3588/3588107.png', // Config
      },
      {
        name: 'MK BYPASS WEEKLY',
        slug: 'mk-bypass-weekly',
        description: '7-days trial access for bypass features.',
        price: 299,
        active: true,
        coverImageUrl: 'https://cdn-icons-png.flaticon.com/512/731/731985.png', // Shield
      }
    ],
    skipDuplicates: true
  });
  console.log('Added 4 more sample products successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
