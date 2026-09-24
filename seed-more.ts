import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.product.count();
  
  if (count < 5) {
    console.log('Adding sample products to populate the slider...');
    
    await prisma.product.createMany({
      data: [
        {
          name: 'MK IOS BYPASS PRO',
          slug: 'mk-ios-bypass-pro',
          description: 'Premium bypass solution for iOS devices with lifetime access.',
          price: 1499,
          active: true,
          coverImageUrl: 'https://cdn-icons-png.flaticon.com/512/731/731985.png', // Apple logo/shield placeholder
        },
        {
          name: 'MK ELITE CONFIG',
          slug: 'mk-elite-config',
          description: 'Top tier configuration settings for competitive edge. 3-Months subscription.',
          price: 999,
          active: true,
          coverImageUrl: 'https://cdn-icons-png.flaticon.com/512/3588/3588107.png', // Settings/Config placeholder
        },
        {
          name: 'MK SETUP SUPPORT',
          slug: 'mk-setup-support',
          description: 'Full guided setup support from our premium agents.',
          price: 499,
          active: true,
          coverImageUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png', // User/Agent placeholder
        }
      ],
      skipDuplicates: true
    });
    console.log('Added 3 sample products successfully.');
  } else {
    console.log('Database already has 5 or more products.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
