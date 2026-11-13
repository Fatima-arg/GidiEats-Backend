import { Sequelize } from 'sequelize';
import { env } from './env';

const database = process.env.NODE_ENV === 'test' ? 'gidieats_test' : env.db.name;

export const sequelize = new Sequelize(database, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: env.db.dialect,
  logging: env.db.logging ? (msg: string) => console.log(msg) : false,
  dialectOptions: env.db.ssl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : {},
  define: {
    underscored: true,
    timestamps: true
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  timezone: '+00:00'
});

export const testConnection = async (): Promise<void> => {
  await sequelize.authenticate();
};