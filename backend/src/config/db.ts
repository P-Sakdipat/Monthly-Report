import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || '',
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

/**
 * Gets a connected MS SQL connection pool.
 * Implements connection pooling for optimal performance and efficiency.
 */
export const getDbConnection = (): Promise<sql.ConnectionPool> => {
  if (poolPromise) return poolPromise;

  poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
      console.log('Successfully connected to MS SQL Server database: ' + process.env.DB_DATABASE);
      return pool;
    })
    .catch(err => {
      console.error('MS SQL Server Connection Failed: ', err.message);
      poolPromise = null; // reset if connection failed to allow retry
      throw err;
    });

  return poolPromise;
};

export { sql };
