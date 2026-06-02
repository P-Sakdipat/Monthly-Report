import { getDbConnection } from './config/db';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  try {
    const pool = await getDbConnection();
    
    // Get all tables
    const tablesResult = await pool.request().query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME LIKE 'p1_%'"
    );
    const tables = tablesResult.recordset.map(r => r.TABLE_NAME);
    
    console.log("=== Columns Schema for p1_ tables ===");
    for (const table of tables) {
      const colsResult = await pool.request().query(
        `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}'`
      );
      console.log(`\nTable: ${table}`);
      console.log(colsResult.recordset.map(c => `${c.COLUMN_NAME} (${c.DATA_TYPE})`).join(', '));
    }
    
    await pool.close();
  } catch (err: any) {
    console.error("Failed to fetch schema:", err.message);
  }
}

run();
