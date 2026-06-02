import { getDbConnection } from './config/db';
import dotenv from 'dotenv';

dotenv.config();

async function test() {
  console.log("=== DB Connection Diagnostics ===");
  console.log("DB_SERVER:", process.env.DB_SERVER);
  console.log("DB_USER:", process.env.DB_USER);
  console.log("DB_DATABASE:", process.env.DB_DATABASE);
  console.log("DB_PASSWORD Length:", process.env.DB_PASSWORD?.length);
  console.log("DB_PASSWORD First 3 chars:", process.env.DB_PASSWORD?.substring(0, 3));
  console.log("DB_PASSWORD Last 3 chars:", process.env.DB_PASSWORD?.slice(-3));

  try {
    console.log("Attempting database connection...");
    const pool = await getDbConnection();
    console.log("🎉 Connection Success!");
    
    console.log("Attempting test query...");
    const result = await pool.request().query("SELECT 1 as [test]");
    console.log("Query success! Result:", result.recordset);
    
    await pool.close();
  } catch (err: any) {
    console.error("❌ Test failed with error:");
    console.error("Code:", err.code);
    console.error("Message:", err.message);
    if (err.originalError) {
      console.error("Original Error Code:", err.originalError.code);
      console.error("Original Error Message:", err.originalError.message);
    }
  }
}

test();
