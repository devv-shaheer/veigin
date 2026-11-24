const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
const { loadEnv } = require("./load-env");

const DB_DIR = path.resolve(__dirname, "..", "db");

function readSql(file) {
  return fs.readFileSync(path.join(DB_DIR, file), "utf8");
}

// Connect to the MySQL server without selecting a database, so schema.sql can
// create the `veigin` database itself. This works on a fresh XAMPP install.
function serverConfig() {
  const url = new URL(process.env.DATABASE_URL);
  return {
    host: url.hostname || "localhost",
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username || "root"),
    password: decodeURIComponent(url.password || ""),
    multipleStatements: true,
  };
}

async function run(command) {
  loadEnv();
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
  }

  const conn = await mysql.createConnection(serverConfig());
  try {
    if (command === "up") {
      await conn.query(readSql("schema.sql"));
      console.log("db:up - schema applied");
    } else if (command === "down") {
      await conn.query(readSql("drop.sql"));
      console.log("db:down - schema dropped");
    } else if (command === "reset") {
      await conn.query(readSql("drop.sql"));
      await conn.query(readSql("schema.sql"));
      console.log("db:reset - schema dropped and reapplied");
    } else {
      throw new Error(`Unknown command "${command}". Use: up | down | reset`);
    }
  } finally {
    await conn.end();
  }
}

run(process.argv[2]).catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});