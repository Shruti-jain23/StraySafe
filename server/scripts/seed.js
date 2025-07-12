import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminId = uuidv4();
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    await query(`
      INSERT INTO users (id, email, password, name, role, "isVerified", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, [adminId, 'admin@straysafe.org', adminPassword, 'Admin User', 'ADMIN', true]);

    // Create sample NGO user
    const ngoUserId = uuidv4();
    const ngoPassword = await bcrypt.hash('ngo123', 12);
    
    await query(`
      INSERT INTO users (id, email, password, name, role, phone, "isVerified", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, [ngoUserId, 'ngo@animalrescue.org', ngoPassword, 'Dr. Sarah Martinez', 'NGO', '+1-555-0123', true]);

    // Create NGO profile
    const ngoProfileId = uuidv4();
    await query(`
      INSERT INTO ngo_profiles (
        id, "userId", "organizationName", description, website, address,
        "servicesOffered", "operatingHours", capacity, "isVerified",
        rating, "totalRescues", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT ("userId") DO NOTHING
    `, [
      ngoProfileId, ngoUserId, 'NYC Animal Rescue',
      'Dedicated to rescuing and rehabilitating stray animals in New York City. We provide emergency medical care, shelter, and adoption services.',
      'https://nycrescue.org', '123 Rescue Street, New York, NY 10001',
      ['Emergency Rescue', 'Medical Treatment', 'Temporary Shelter', 'Adoption Services'],
      'Mon-Fri: 9AM-6PM, Emergency: 24/7', '50-100 animals', true, 4.8, 156
    ]);

    // Create sample citizen users
    const citizenUsers = [
      {
        id: uuidv4(),
        email: 'sarah.johnson@email.com',
        name: 'Sarah Johnson',
        phone: '+1-555-0124'
      },
      {
        id: uuidv4(),
        email: 'maria.garcia@email.com',
        name: 'Maria Garcia',
        phone: '+1-555-0125'
      },
      {
        id: uuidv4(),
        email: 'james.chen@email.com',
        name: 'James Chen',
        phone: '+1-555-0126'
      }
    ];

    const citizenPassword = await bcrypt.hash('citizen123', 12);

    for (const citizen of citizenUsers) {
      await query(`
        INSERT INTO users (id, email, password, name, role, phone, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `, [citizen.id, citizen.email, citizenPassword, citizen.name, 'CITIZEN', citizen.phone]);
    }

    // Create sample reports
    const reports = [
      {
        id: uuidv4(),
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
        reportedById: citizenUsers[0].id,
        assignedNGOId: ngoProfileId
      },
      {
        id: uuidv4(),
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
        reportedById: citizenUsers[1].id,
        assignedNGOId: null
      },
      {
        id: uuidv4(),
        title: 'Friendly Stray Looking for Home',
        description: 'Very friendly golden retriever mix, appears well-groomed. Might be lost rather than abandoned. No collar or tags visible.',
        latitude: 40.7614,
        longitude: -73.9776,
        address: 'Times Square, New York, NY',
        photos: [
          'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=800'
        ],
        status: 'RESCUED',
        urgency: 'LOW',
        tags: ['dog', 'friendly', 'possible-lost-pet'],
        reportedById: citizenUsers[2].id,
        assignedNGOId: ngoProfileId
      }
    ];

    for (const report of reports) {
      await query(`
        INSERT INTO reports (
          id, title, description, latitude, longitude, address, photos,
          status, urgency, tags, "reportedById", "assignedNGOId", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [
        report.id, report.title, report.description, report.latitude, report.longitude,
        report.address, report.photos, report.status, report.urgency, report.tags,
        report.reportedById, report.assignedNGOId
      ]);
    }

    // Create sample report updates
    const updates = [
      {
        id: uuidv4(),
        reportId: reports[0].id,
        authorId: ngoUserId,
        message: 'Report received. Team dispatched to location.',
        photos: []
      },
      {
        id: uuidv4(),
        reportId: reports[0].id,
        authorId: ngoUserId,
        message: 'Dog found and secured. Taking to veterinary clinic for treatment.',
        photos: ['https://images.pexels.com/photos/4587998/pexels-photo-4587998.jpeg?auto=compress&cs=tinysrgb&w=800']
      },
      {
        id: uuidv4(),
        reportId: reports[2].id,
        authorId: ngoUserId,
        message: 'Dog has been safely rescued and is being cared for at our facility.',
        photos: []
      }
    ];

    for (const update of updates) {
      await query(`
        INSERT INTO report_updates (id, "reportId", "authorId", message, photos, "createdAt")
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (id) DO NOTHING
      `, [update.id, update.reportId, update.authorId, update.message, update.photos]);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Sample accounts created:');
    console.log('👤 Admin: admin@straysafe.org / admin123');
    console.log('🏥 NGO: ngo@animalrescue.org / ngo123');
    console.log('👥 Citizens: sarah.johnson@email.com / citizen123');
    console.log('           maria.garcia@email.com / citizen123');
    console.log('           james.chen@email.com / citizen123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData().then(() => {
    process.exit(0);
  });
}

export default seedData;