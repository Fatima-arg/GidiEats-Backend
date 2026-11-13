'use strict';
require('dotenv').config();

const bool = (v, d = false) =>
  v === undefined ? d : ['1', 'true', 'yes', 'TRUE'].includes(String(v).toLowerCase());

const parseDatabaseUrl = (rawUrl) => {
  if (!rawUrl) return null;
  try {
    const { URL } = require('url');
    const u = new URL(rawUrl);
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      database: u.pathname.replace(/^\//, ''),
      username: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      ssl: u.searchParams.get('ssl-mode') === 'REQUIRED' || bool(process.env.DB_SSL, true)
    };
  } catch {
    return null;
  }
};

const parsed = parseDatabaseUrl(process.env.DATABASE_URL || process.env.DB_URI);
const host = parsed ? parsed.host : (process.env.DB_HOST || '127.0.0.1');
const isCloud = host.includes('aivencloud.com') || host.includes('render.com') || host.includes('aws') || host.includes('railway');
const isSsl = parsed ? parsed.ssl : (bool(process.env.DB_SSL, false) || isCloud);

const dialectOptions = isSsl
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  : {};

const baseConfig = {
  username: parsed ? parsed.username : (process.env.DB_USER || 'root'),
  password: parsed ? parsed.password : (process.env.DB_PASSWORD || ''),
  database: parsed ? parsed.database : (process.env.DB_NAME || 'gidieats'),
  host,
  port: parsed ? parsed.port : Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: false,
  dialectOptions,
  define: { underscored: true, timestamps: true }
};

module.exports = {
  development: baseConfig,
  test: {
    ...baseConfig,
    database: 'gidieats_test'
  },
  production: baseConfig
};