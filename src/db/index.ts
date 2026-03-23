import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbServer = process.env.DB_SERVER;

if (!dbServer) {
  throw new Error("DB_SERVER environment variable is not defined.");
}

const [host, instanceName] = dbServer.split('\\');

// ✅ Shared pool config
const poolConfig = {
  max: 60,       // max connections in pool
  min: 5,        // keep 5 connections alive always
  acquire: 30000, // max ms to wait for a connection before throwing error
  idle: 10000,    // close connection if unused for 10s
};

// MSSQL
export const mssqlSequelize = new Sequelize(process.env.DB_NAME!, process.env.DB_USER!, process.env.DB_PASSWORD!, {
  dialect: "mssql",
  host,
  port: parseInt(process.env.DB_PORT || "1433"),
  dialectOptions: {
    options: {
      instanceName,
      encrypt: false,
      trustServerCertificate: true,
    },
  },
  pool: poolConfig, // ✅ added
  logging: false,
});

// PostgreSQL
export const postgresSequelize = new Sequelize(
  process.env.POSTGRES_DB_NAME!,
  process.env.POSTGRES_DB_USER!,
  process.env.POSTGRES_DB_PASSWORD!,
  {
    dialect: "postgres",
    host: process.env.POSTGRES_DB_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_DB_PORT || "5432"),
    pool: poolConfig, // ✅ added
    logging: false,
  }
);

export const testConnections = async () => {
  try {
    await mssqlSequelize.authenticate();
    console.log('MSSQL Database connection has been established successfully.');

    await postgresSequelize.authenticate();
    console.log('PostgreSQL Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the databases:', error);
  }
};

export { mssqlSequelize as sequelize };