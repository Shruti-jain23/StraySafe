import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@straysafe.org' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@straysafe.org',
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true
    }
  });

  // Create NGO user
  const ngoUser = await prisma.user.upsert({
    where: { email: 'ngo@example.org' },
    update: {},
    create: {
      name: 'NGO Representative',
      email: 'ngo@example.org',
      password: hashedPassword,
      role: 'NGO',
      phone: '+1234567890',
      isVerified: true
    }
  });

  // Create NGO profile
  const ngoProfile = await prisma.nGOProfile.upsert({
    where: { userId: ngoUser.id },
    update: {},
    create: {
      userId: ngoUser.id,
      organizationName: 'Animal Rescue Foundation',
      description: 'Dedicated to rescuing and rehabilitating stray animals in the city.',
      address: '123 Rescue Street, New York, NY 10001',
      servicesOffered: ['Emergency Rescue', 'Medical Treatment', 'Adoption Services'],
      operatingHours: '24/7 Emergency, Office: 9AM-6PM',
      capacity: '50-100',
      isVerified: true,
      rating: 4.8,
      totalRescues: 150
    }
  });

  // Create citizen user
  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@example.com' },
    update: {},
    create: {
      name: 'John Citizen',
      email: 'citizen@example.com',
      password: hashedPassword,
      role: 'CITIZEN',
      phone: '+1987654321',
      isVerified: true
    }
  });

  // Create sample reports
  const report1 = await prisma.report.create({
    data: {
      title: 'Injured Dog Near Central Park',
      description: 'Found an injured stray dog near Central Park. Appears to have a wounded leg and is limping. Very friendly but needs immediate medical attention.',
      latitude: 40.7829,
      longitude: -73.9654,
      address: 'Central Park, New York, NY',
      photos: [
        'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/58997/pexels-photo-58997.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      status: 'IN_PROGRESS',
      urgency: 'HIGH',
      tags: ['injured', 'dog', 'medical-attention'],
      reportedById: citizen.id,
      assignedNGOId: ngoProfile.id
    }
  });

  const report2 = await prisma.report.create({
    data: {
      title: 'Mother Cat with Kittens',
      description: 'Found a mother cat with 3 small kittens in an abandoned building. They appear healthy but need shelter and food.',
      latitude: 40.7505,
      longitude: -73.9934,
      address: 'Brooklyn, NY',
      photos: [
        'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      status: 'REPORTED',
      urgency: 'MEDIUM',
      tags: ['cat', 'kittens', 'shelter-needed'],
      reportedById: citizen.id
    }
  });

  // Create report updates
  await prisma.reportUpdate.create({
    data: {
      reportId: report1.id,
      authorId: ngoUser.id,
      message: 'Report received. Team dispatched to location.',
      photos: []
    }
  });

  await prisma.reportUpdate.create({
    data: {
      reportId: report1.id,
      authorId: ngoUser.id,
      message: 'Dog found and secured. Taking to veterinary clinic for treatment.',
      photos: ['https://images.pexels.com/photos/4587998/pexels-photo-4587998.jpeg?auto=compress&cs=tinysrgb&w=800']
    }
  });

  console.log('Database seeded successfully!');
  console.log('Test accounts created:');
  console.log('Admin: admin@straysafe.org / password123');
  console.log('NGO: ngo@example.org / password123');
  console.log('Citizen: citizen@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });