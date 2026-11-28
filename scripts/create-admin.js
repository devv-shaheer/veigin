const readline = require("node:readline");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
const { loadEnv } = require("./load-env");

// Interactive admin-user creator.
// - Email and password are prompted; the password is never taken from a
//   command-line argument (that would land in shell history) and is never
//   printed, echoed, or hashed into any output.
// - Password is enforced to be at least 12 characters and hashed with
//   bcryptjs at cost 12.
// - If the email already exists, the script refuses to continue.

const MIN_PASSWORD_LENGTH = 12;
const BCRYPT_COST = 12;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Ask a question, hiding the typed characters. The prompt is written directly
// so the query text still appears; readline's output hook is then overridden
// to swallow the echoed keystrokes (the standard way to build a masked input).
function askHidden(query) {
  return new Promise((resolve) => {
    process.stdout.write(query);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    rl._writeToOutput = function () {
      // Suppress the echo of the secret.
      this.output.write("");
    };
    rl.on("line", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function ask(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function askValidPassword(label) {
  for (;;) {
    const value = await askHidden(`${label}: `);
    if (value.length >= MIN_PASSWORD_LENGTH) return value;
    console.error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters. Try again.`,
    );
  }
}

async function main() {
  loadEnv();
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
  }

  const email = (await ask("Admin email: ")).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw new Error(`"${email}" is not a valid email address.`);
  }

  const password = await askValidPassword("Password");
  const confirm = await askHidden("Confirm password: ");
  if (password !== confirm) {
    throw new Error("Passwords do not match.");
  }

  // Hash after validation so a mismatch never touches bcrypt (and never logs).
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL });
  try {
    const [existing] = await conn.query(
      "SELECT id FROM admin_users WHERE email = ? LIMIT 1",
      [email],
    );
    if (existing.length > 0) {
      throw new Error(
        `An admin with the email "${email}" already exists. Refusing to create another.`,
      );
    }

    await conn.execute(
      "INSERT INTO admin_users (email, password_hash) VALUES (?, ?)",
      [email, passwordHash],
    );
  } catch (err) {
    // Fallback for the unique-constraint race (two scripts at once).
    if (err && err.code === "ER_DUP_ENTRY") {
      throw new Error(
        `An admin with the email "${email}" already exists. Refusing to create another.`,
      );
    }
    throw err;
  } finally {
    await conn.end();
  }

  // Only the email is reported. Never the password, never the hash.
  console.log(`Created admin user: ${email}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
