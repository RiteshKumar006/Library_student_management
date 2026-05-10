import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading env from:', envPath);
console.log('File exists:', fs.existsSync(envPath));
const result = dotenv.config({ path: envPath });
console.log('Dotenv result:', result.parsed ? Object.keys(result.parsed) : 'No parsed config');

async function setupDatabase() {
  const [{ connectToDatabase, closeDatabase }, { hashPassword }, { SEAT_RANGE }] = await Promise.all([
    import('@/lib/db'),
    import('@/lib/auth'),
    import('@/lib/constants'),
  ]);

  try {
    console.log('Connecting to MongoDB...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '<set>' : '<missing>');
    const { db } = await connectToDatabase();

    // Create admin user
    console.log('Creating admin user...');
    const adminsCollection = db.collection('admins');

    const existingAdmin = await adminsCollection.findOne({ email: 'admin@library.com' });

    if (!existingAdmin) {
      const hashedPassword = await hashPassword('admin123');
      await adminsCollection.insertOne({
        email: 'admin@library.com',
        password: hashedPassword,
        name: 'Library Admin',
        phone: '+91 9876543210',
        libraryName: 'LibraryHub',
        address: '123 Main Street, City, State 123456',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✓ Admin user created: admin@library.com / admin123');
    } else {
      console.log('✓ Admin user already exists');
    }

    // Initialize seats
    console.log('Initializing seats...');
    const seatsCollection = db.collection('seats');

    const existingSeats = await seatsCollection.countDocuments();

    if (existingSeats === 0) {
      const seats = Array.from({ length: SEAT_RANGE }, (_, i) => ({
        seatNumber: i + 1,
        isAvailable: true,
        assignedStudentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await seatsCollection.insertMany(seats);
      console.log(`✓ ${SEAT_RANGE} seats initialized`);
    } else {
      console.log('✓ Seats already initialized');
    }

    // Create dummy student
    console.log('Creating dummy student...');
    const studentsCollection = db.collection('students');

    const existingStudent = await studentsCollection.findOne({ phone: '9876543210' });

    if (!existingStudent) {
      const joiningDate = new Date();
      const nextDueDate = new Date(joiningDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      await studentsCollection.insertOne({
        name: 'John Doe',
        phone: '9876543210',
        seatNumber: 1,
        joiningDate,
        monthlyFee: 500,
        nextDueDate,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✓ Dummy student created: John Doe (9876543210)');
    } else {
      console.log('✓ Dummy student already exists');
    }

    console.log('\n✅ Database setup completed successfully!');
    console.log('You can now login with:');
    console.log('  Email: admin@library.com');
    console.log('  Password: admin123');

    await closeDatabase();
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
