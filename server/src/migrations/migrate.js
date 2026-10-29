import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import { store } from '../models/store.js';
import { hashPassword } from '../utils/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export async function runMigrations() {
  console.log('[MIGRATION] Running initial schema and database seeding...');
  await connectDB(process.env.MONGODB_URI);

  // 1. Seed primary Admin if not exists
  const primaryAdminEmail = 'prathambhadauriaab_aiml24@its.edu.in';
  let admin = await store.findUserByEmail(primaryAdminEmail);
  if (!admin) {
    const adminPassword = await hashPassword('Admin123!');
    admin = await store.createUser({
      email: primaryAdminEmail,
      password: adminPassword,
      role: 'admin'
    });
    console.log(`✅ [MIGRATION] Seeded primary Admin: ${primaryAdminEmail} / Admin123!`);
  } else if (admin.role !== 'admin') {
    await store.updateUser(admin.id, { role: 'admin' });
  }

  // Also seed backup generic admin if not exists
  let genericAdmin = await store.findUserByEmail('admin@edufolio.edu');
  if (!genericAdmin) {
    const adminPassword = await hashPassword('Admin123!');
    await store.createUser({
      email: 'admin@edufolio.edu',
      password: adminPassword,
      role: 'admin'
    });
  }

  // 2. Seed default Faculty if not exists
  let facultyUser = await store.findUserByEmail('faculty@edufolio.edu');
  if (!facultyUser) {
    const facultyPassword = await hashPassword('Faculty123!');
    facultyUser = await store.createUser({
      email: 'faculty@edufolio.edu',
      password: facultyPassword,
      role: 'faculty'
    });
    await store.createFaculty({
      userId: facultyUser.id,
      name: 'Dr. Alan Turing',
      department: 'Computer Science & AI'
    });
    console.log('✅ [MIGRATION] Seeded default Faculty: faculty@edufolio.edu / Faculty123!');
  }

  console.log('[MIGRATION] All database migrations completed successfully.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().then(() => process.exit(0)).catch((err) => {
    console.error('[MIGRATION ERROR]', err);
    process.exit(1);
  });
}
