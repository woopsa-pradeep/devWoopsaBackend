import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// MSSQL Configuration
const dbServer = process.env.DB_SERVER;

if (!dbServer) {
  throw new Error("DB_SERVER environment variable is not defined.");
}

const [host, instanceName] = dbServer.split('\\');

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
  logging: false,
});

// PostgreSQL Configuration
export const postgresSequelize = new Sequelize(
  process.env.POSTGRES_DB_NAME!,
  process.env.POSTGRES_DB_USER!,
  process.env.POSTGRES_DB_PASSWORD!,
  {
    dialect: "postgres",
    host: process.env.POSTGRES_DB_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_DB_PORT || "5432"),
   
    logging: false,
  }
);

// Test connections
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

// Export both connections
export { mssqlSequelize as sequelize }; // Keep backward compatibility