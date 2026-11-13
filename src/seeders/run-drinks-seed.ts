import dotenv from 'dotenv';
dotenv.config();
import { Sequelize } from 'sequelize';
import { seedDrinksAndSmoothies } from './seed-drinks';

const CLOUD_DB_URI = process.env.DATABASE_URL || '';
const DB_SSL = process.env.DB_SSL === 'true' || !!process.env.DATABASE_URL;

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'gidieats',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

async function run() {
  console.log('=== SEEDING DRINKS & SMOOTHIES ===');

  // 1. Seed to configured Database (Cloud or Local based on env)
  console.log('\n--- Connecting to Database ---');
  try {
    let sequelizeInstance: Sequelize;
    if (CLOUD_DB_URI) {
      sequelizeInstance = new Sequelize(CLOUD_DB_URI, {
        dialect: 'mysql',
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
        logging: false
      });
    } else {
      sequelizeInstance = new Sequelize(DB_CONFIG.database, DB_CONFIG.username, DB_CONFIG.password, {
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        dialect: 'mysql',
        dialectOptions: DB_SSL ? { ssl: { require: true, rejectUnauthorized: false } } : undefined,
        logging: false
      });
    }
    await sequelizeInstance.authenticate();
    console.log(' Connected to Database successfully.');
    await seedDrinksAndSmoothies(sequelizeInstance);
    console.log(' Drinks & smoothies seeding complete!');
    await sequelizeInstance.close();
  } catch (err: any) {
    console.error(' Database seeding error:', err.message);
  }

  console.log('\n=== DONE ===');
}

run();
