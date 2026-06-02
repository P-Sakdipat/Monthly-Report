import sql from 'mssql';

const host = "20.239.48.184";

// Test different user and password combinations WITHOUT a database parameter
const combinations = [
  { user: "TEST_sa", pwd: "C11@tCll@i" },
  { user: "TEST_sa", pwd: "C11@tC11@i" },
  { user: "sa", pwd: "C11@tCll@i" },
  { user: "sa", pwd: "C11@tC11@i" }
];

async function tryConnect(user: string, pwd: string): Promise<boolean> {
  const config: sql.config = {
    user,
    password: pwd,
    server: host,
    // Database is omitted to connect to the user's default database (e.g. master)
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    connectionTimeout: 5000
  };

  try {
    const conn = await sql.connect(config);
    console.log(`✅ Success without DB parameter! User: "${user}" Password: "${pwd}"`);
    
    // Let's query list of databases to see if MD_monthly is there
    const result = await conn.request().query("SELECT name FROM sys.databases");
    console.log("Databases list:", result.recordset.map(r => r.name));
    
    await conn.close();
    return true;
  } catch (err: any) {
    console.log(`Failed for User: "${user}" with Password: "${pwd}": ${err.message}`);
    return false;
  }
}

async function run() {
  console.log("=== Testing without Database Parameter ===");
  for (const combo of combinations) {
    const success = await tryConnect(combo.user, combo.pwd);
    if (success) {
      console.log(`\n🎉 SUCCESSFUL CONNECTION!\n`);
      return;
    }
  }
  console.log("\n❌ All combinations failed.");
}

run();
