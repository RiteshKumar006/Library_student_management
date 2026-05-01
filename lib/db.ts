import { Db, MongoClient, MongoClientOptions, ServerApiVersion } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/library_db';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || getDatabaseName(MONGODB_URI) || 'library_db';
const IS_ATLAS_URI = MONGODB_URI.startsWith('mongodb+srv://');

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let connectionPromise: Promise<{ client: MongoClient; db: Db }> | null = null;

function getDatabaseName(uri: string): string | null {
  try {
    const parsedUri = new URL(uri);
    const dbName = parsedUri.pathname.replace(/^\//, '');
    return dbName || null;
  } catch {
    return null;
  }
}

async function createIndexes(db: Db) {
  await Promise.all([
    db.collection('students').createIndex({ phone: 1 }),
    db.collection('students').createIndex({ seatNumber: 1 }),
    db.collection('students').createIndex({ status: 1 }),
    db.collection('payments').createIndex({ studentId: 1 }),
    db.collection('payments').createIndex({ paymentDate: -1 }),
    db.collection('seats').createIndex({ seatNumber: 1 }),
    db.collection('admins').createIndex({ email: 1 }, { unique: true }),
  ]);
}

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    const options: MongoClientOptions = {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority',
    };

    if (IS_ATLAS_URI) {
      options.tls = true;
      options.serverApi = {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      };
    }

    const client = new MongoClient(MONGODB_URI, options);
    await client.connect();

    const db = client.db(MONGODB_DB_NAME);
    await createIndexes(db);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  })();

  try {
    return await connectionPromise;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    connectionPromise = null;
    throw error;
  }
}

export async function getDatabase() {
  const { db } = await connectToDatabase();
  return db;
}

export async function closeDatabase() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    connectionPromise = null;
  }
}
