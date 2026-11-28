const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
const { loadEnv } = require("./load-env");

const DB_DIR = path.resolve(__dirname, "..", "db");

function readSql(file) {
  return fs.readFileSync(path.join(DB_DIR, file), "utf8");
}

// Homepage scatter columns added after the stage-1 schema shipped. Existing
// databases (created before these columns existed) are upgraded in place with an
// information_schema guard so re-running `db:up` is safe and never drops data.
const HOME_COLUMNS = [
  { name: "show_on_home", ddl: "BOOLEAN NOT NULL DEFAULT FALSE" },
  { name: "home_x", ddl: "DECIMAL(5,2) NOT NULL DEFAULT 50.00" },
  { name: "home_y", ddl: "DECIMAL(5,2) NOT NULL DEFAULT 50.00" },
  { name: "home_rot", ddl: "DECIMAL(4,2) NOT NULL DEFAULT 0.00" },
];

function dbName() {
  const url = new URL(process.env.DATABASE_URL);
  return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
}

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    "SELECT 1 AS ok FROM information_schema.columns " +
      "WHERE table_schema = ? AND table_name = ? AND column_name = ? LIMIT 1",
    [dbName(), table, column],
  );
  return rows.length > 0;
}

async function ensureHomeColumns(conn) {
  let added = 0;
  for (const col of HOME_COLUMNS) {
    if (await columnExists(conn, "products", col.name)) continue;
    await conn.query(
      "ALTER TABLE `" +
        dbName() +
        "`.`products` ADD COLUMN `" +
        col.name +
        "` " +
        col.ddl,
    );
    added += 1;
  }
  return added;
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
      const added = await ensureHomeColumns(conn);
      await conn.query(readSql("admin.sql"));
      console.log(
        "db:up - schema applied" + (added ? ` (${added} column(s) added)` : ""),
      );
    } else if (command === "down") {
      await conn.query(readSql("admin-drop.sql"));
      await conn.query(readSql("drop.sql"));
      console.log("db:down - schema dropped");
    } else if (command === "reset") {
      await conn.query(readSql("admin-drop.sql"));
      await conn.query(readSql("drop.sql"));
      await conn.query(readSql("schema.sql"));
      await ensureHomeColumns(conn);
      await conn.query(readSql("admin.sql"));
      console.log("db:reset - schema dropped and reapplied");
    } else if (command === "admin-down") {
      await conn.query(readSql("admin-drop.sql"));
      console.log("db:admin-down - admin tables dropped");
    } else {
      throw new Error(
        `Unknown command "${command}". Use: up | down | reset | admin-down`,
      );
    }
  } finally {
    await conn.end();
  }
}

run(process.argv[2]).catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});