import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to generate random wallet addresses
function generateWallet(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

// Helper function to generate random coin addresses
function generateCoinAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

async function main() {
  console.log('🌱 Seeding CollabFeed database...');

  // Main creator wallet
  const creatorWallet = '0x49773872fF6e6115CeADe91EEBAFAC0734A31Ae1';
  
  // Generate random collaborator wallets
  const collaboratorWallets = [
    generateWallet(), // Luna
    generateWallet(), // Koda
    generateWallet(), // Alex
    generateWallet(), // Dharma
    generateWallet()  // Additional collaborator
  ];

  console.log('📝 Creating collaboration posts...');

  // Post 1: Dark short film - Actors in negative role (open, no pings)
  const post1 = await prisma.collaborationPost.create({
    data: {
      coinAddress: generateCoinAddress(),
      creatorWallet,
      role: 'Actors in negative role',
      paymentType: 'paid',
      credits: true,
      workStyle: 'contract',
      location: 'Remote',
      status: 'open',
      collaborators: [
        {
          role: 'Actors in negative role',
          creatorType: 'indie',
          credits: 35,
          compensationType: 'paid',
          timeCommitment: 'one_time',
          jobDescription: 'Seeking talented actors for negative roles in our psychological thriller short film. Must be comfortable with intense dramatic scenes.'
        }
      ],
      createdAt: new Date('2024-01-10T10:00:00Z'),
      expiresAt: new Date('2024-02-10T23:59:59Z')
    }
  });

  // Post 2: Cyber Beats EP - Mix Engineer (shortlisted status, has 1 accepted ping)
  const post2 = await prisma.collaborationPost.create({
    data: {
      coinAddress: generateCoinAddress(),
      creatorWallet,
      role: 'Mix Engineer',
      paymentType: 'paid',
      credits: false,
      workStyle: 'freestyle',
      location: 'LA',
      status: 'shortlisted',
      collaborators: [
        {
          role: 'Mix Engineer',
          creatorType: 'org',
          credits: 0,
          compensationType: 'paid',
          timeCommitment: 'one_time',
          jobDescription: 'Need an experienced mix engineer for our 5-track EP. Must have experience with electronic music.'
        }
      ],
      createdAt: new Date('2024-01-12T14:30:00Z'),
      expiresAt: new Date('2024-02-12T23:59:59Z')
    }
  });

  // Post 3: Abstract Motion - 3D Animator (open, has 1 pending ping)
  const post3 = await prisma.collaborationPost.create({
    data: {
      coinAddress: generateCoinAddress(),
      creatorWallet,
      role: '3D Animator',
      paymentType: 'barter',
      credits: true,
      workStyle: 'freestyle',
      location: 'Remote',
      status: 'open',
      collaborators: [
        {
          role: '3D Animator',
          creatorType: 'indie',
          credits: 30,
          compensationType: 'barter',
          timeCommitment: 'ongoing',
          jobDescription: 'Seeking a talented 3D animator to bring our abstract concepts to life with smooth, flowing animations.'
        }
      ],
      createdAt: new Date('2024-01-08T09:15:00Z'),
      expiresAt: new Date('2024-02-08T23:59:59Z')
    }
  });

  console.log('📨 Creating pings...');

  // Create pings for posts 2 and 3
  const ping1 = await prisma.ping.create({
    data: {
      collabPostId: post2.id,
      pingedWallet: collaboratorWallets[0], // Luna
      interestedRole: 'Mix Engineer',
      bio: 'Award-winning sound designer for films with 8+ years experience in electronic music production.',
      status: 'accepted',
      createdAt: new Date('2024-01-13T10:30:00Z'),
      respondedAt: new Date('2024-01-13T15:30:00Z')
    }
  });

  const ping2 = await prisma.ping.create({
    data: {
      collabPostId: post3.id,
      pingedWallet: collaboratorWallets[2], // Alex
      interestedRole: 'Animator',
      bio: 'Freelance animator with Netflix credits and 6 years of experience in 3D animation.',
      status: 'pending',
      createdAt: new Date('2024-01-09T14:20:00Z')
    }
  });

  console.log('🤝 Creating matches...');

  // Create match for accepted ping (post 2 - Cyber Beats EP)
  const match1 = await prisma.match.create({
    data: {
      id: ping1.id, // Use the ping ID as the match ID
      collabPostId: post2.id,
      creatorWallet,
      collaboratorWallet: collaboratorWallets[0], // Luna
      projectName: 'Cyber Beats EP',
      role: 'Mix Engineer',
      status: 'active',
      createdAt: new Date('2024-01-13T15:30:00Z'),
      lastMessageAt: new Date('2024-01-15T16:45:00Z'),
      unreadCount: 0
    }
  });

  console.log('💬 Creating messages...');

  // Create messages for match1 (Cyber Beats EP)
  await prisma.message.create({
    data: {
      matchId: match1.id,
      senderWallet: creatorWallet,
      content: 'Hi Luna! Thanks for your interest in the Cyber Beats EP project. I\'d love to hear more about your experience with electronic music.',
      messageType: 'text',
      createdAt: new Date('2024-01-13T16:00:00Z'),
      readAt: new Date('2024-01-13T16:15:00Z')
    }
  });

  await prisma.message.create({
    data: {
      matchId: match1.id,
      senderWallet: collaboratorWallets[0], // Luna
      content: 'Hello! Thank you for accepting my application. I\'ve worked on several electronic EPs and have experience with the specific sound you\'re looking for. Here\'s a link to my portfolio: https://example.com/luna-portfolio',
      messageType: 'text',
      createdAt: new Date('2024-01-13T17:30:00Z'),
      readAt: new Date('2024-01-13T17:35:00Z')
    }
  });

  await prisma.message.create({
    data: {
      matchId: match1.id,
      senderWallet: creatorWallet,
      content: 'Your portfolio looks amazing! The electronic work is exactly what we need. Can you tell me about your availability and rates for a 5-track EP?',
      messageType: 'text',
      createdAt: new Date('2024-01-14T10:45:00Z'),
      readAt: new Date('2024-01-14T11:00:00Z')
    }
  });

  await prisma.message.create({
    data: {
      matchId: match1.id,
      senderWallet: collaboratorWallets[0], // Luna
      content: 'I\'m available starting next week and my rates are competitive for indie projects. I typically deliver within 2-3 weeks for a full EP. I can work remotely and provide stems for each track.',
      messageType: 'text',
      createdAt: new Date('2024-01-14T14:20:00Z'),
      readAt: new Date('2024-01-14T14:25:00Z')
    }
  });

  await prisma.message.create({
    data: {
      matchId: match1.id,
      senderWallet: creatorWallet,
      content: 'Perfect! I\'ll send you the project files and reference tracks. Looking forward to working together!',
      messageType: 'text',
      createdAt: new Date('2024-01-15T16:45:00Z'),
      readAt: new Date('2024-01-15T16:50:00Z')
    }
  });

  await prisma.message.create({
    data: {
      matchId: match1.id,
      senderWallet: collaboratorWallets[0], // Luna
      content: 'Final mix is ready!',
      messageType: 'text',
      createdAt: new Date('2024-01-16T14:30:00Z')
    }
  });

  console.log('✅ Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Created 3 collaboration posts`);
  console.log(`- Created 2 pings (1 accepted, 1 pending)`);
  console.log(`- Created 1 active match`);
  console.log(`- Created 6 messages in 1 conversation`);
  console.log(`\n🎯 Creator wallet: ${creatorWallet}`);
  console.log(`👥 Collaborator wallets:`);
  console.log(`  - Luna (Mix Engineer): ${collaboratorWallets[0]}`);
  console.log(`  - Koda: ${collaboratorWallets[1]}`);
  console.log(`  - Alex (3D Animator): ${collaboratorWallets[2]}`);
  console.log(`  - Dharma: ${collaboratorWallets[3]}`);
  console.log(`  - Additional: ${collaboratorWallets[4]}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });