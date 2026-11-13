import { createApp } from './app';
import { env } from './config/env';
import { testConnection, sequelize } from './config/database';

const start = async () => {
  try {
    await testConnection();
    console.log(`✓ Database connection established successfully (${env.db.host}:${env.db.port}/${env.db.name})`);
    if (env.db.ssl) {
      console.log('✓ SSL mode enabled for secure cloud database transport');
    }

    // Auto-sync schema fallback if fresh cloud DB
    try {
      const [tables]: any = await sequelize.query("SHOW TABLES LIKE 'users'");
      if (!Array.isArray(tables) || tables.length === 0) {
        console.log('⚡ Initializing database schema on cloud database...');
        await import('./models');
        await sequelize.sync({ alter: false });
        console.log('✓ Tables synced successfully.');
      }
    } catch (syncErr) {
      console.warn('Note: Schema check notice:', syncErr);
    }
  } catch (err) {
    console.error('✗ Failed to connect to database:', err);
    console.error(`  Target: ${env.db.host}:${env.db.port}/${env.db.name} (SSL: ${env.db.ssl ? 'ON' : 'OFF'})`);
    console.error('  Ensure database credentials and environment variables are set correctly in your Render dashboard.');
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`✓ GidiEats API running on http://0.0.0.0:${env.port}`);
    console.log(`  Environment: ${env.nodeEnv}`);
    console.log(`  Client origin: ${env.clientUrl}`);
  });
};

start();