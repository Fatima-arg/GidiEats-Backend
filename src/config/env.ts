import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const bool = (v: string | undefined, d = false) =>
  v === undefined ? d : ['1', 'true', 'yes', 'TRUE'].includes(String(v).toLowerCase());

const parseDatabaseUrl = (rawUrl?: string) => {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      name: u.pathname.replace(/^\//, ''),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      ssl: u.searchParams.get('ssl-mode') === 'REQUIRED' || bool(process.env.DB_SSL, true)
    };
  } catch {
    return null;
  }
};

const parsedUrl = parseDatabaseUrl(process.env.DATABASE_URL || process.env.DB_URI);
const dbHost = parsedUrl?.host || process.env.DB_HOST || '127.0.0.1';
const isCloudHost = dbHost.includes('aivencloud.com') || dbHost.includes('render.com') || dbHost.includes('aws') || dbHost.includes('railway');
const dbSsl = parsedUrl ? parsedUrl.ssl : (bool(process.env.DB_SSL, false) || isCloudHost);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5001),
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    host: dbHost,
    port: parsedUrl?.port || Number(process.env.DB_PORT || 3306),
    name: parsedUrl?.name || process.env.DB_NAME || 'gidieats',
    user: parsedUrl?.user || process.env.DB_USER || 'root',
    password: parsedUrl?.password !== undefined ? parsedUrl.password : (process.env.DB_PASSWORD || ''),
    dialect: (process.env.DB_DIALECT || 'mysql') as 'mysql',
    ssl: dbSsl,
    logging: bool(process.env.DB_LOGGING, false)
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  seedPassword: process.env.SEED_PASSWORD || 'Demo@123',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  flutterwave: {
    publicKey: process.env.FLW_PUBLIC_KEY || 'FLWPUBK_TEST-SANDBOXDEMOKEY-X',
    secretKey: process.env.FLW_SECRET_KEY || 'FLWSECK_TEST-SANDBOXDEMOKEY-X',
    encryptionKey: process.env.FLW_ENCRYPTION_KEY || 'FLWSECK_TEST_ENCRYPT-X',
    secretHash: process.env.FLW_SECRET_HASH || 'gidieats_flw_secret_hash'
  }
};