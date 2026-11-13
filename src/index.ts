import { createApp } from './app';
import { env } from './config/env';
import { testConnection } from './config/database';

const start = async () => {
  try {
    await testConnection();
    console.log('✓ Database connection established');
  } catch (err) {
    console.error('✗ Failed to connect to database:', err);
    console.error('  Ensure MySQL is running and the credentials in backend/.env are correct.');
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`✓ GidiEats API running on http://localhost:${env.port}`);
    console.log(`  Client origin: ${env.clientUrl}`);
  });
};

start();