"use server";
import "server-only";
import { cookies } from "next/headers";
import { query } from "./db";
import { createHash } from "crypto";

// ---------- helpers ----------

function isProd(): boolean {
  const url = new URL(process.env.DATABASE_URL || "");
  return !url.hostname.includes("localhost") && !url.hostname.includes("127.0.0.1");
}

function cookieName(): string {
  return isProd() ? "__Host-vg_session" : "vg_session";
}

function cookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  path: string;
  maxAge?: number | undefined;
  secure: boolean;
} {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 12 * 60 * 60, // 12 hours
    secure: isProd(),
  };
}

// ---------- DB helpers ----------

async function findSession(tokenHash: string) {
  const rows = await query<{ id: number; admin_user_id: number; token_hash: string; expires_at: string; last_used_at: string }>(
    "SELECT id, admin_user_id, token_hash, expires_at, last_used_at FROM admin_sessions WHERE token_hash = ?",
    [tokenHash],
  );
  return rows[0] ?? null;
}

async function recordAttempt(email: string, ip: string | null) {
  await query("INSERT INTO admin_login_attempts (email, ip) VALUES (?, ?)", [email, ip]);
}

async function cleanupOldAttempts(email: string) {
  await query(
    "DELETE FROM admin_login_attempts WHERE email = ? AND created_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)",
    [email],
  );
}

// ---------- createSession ----------

export async function createSession(adminId: number): Promise<string> {
  // Generate a random 32-byte token using built-in crypto
  const crypto = require("crypto");
  const rawToken = crypto.randomBytes(32).toString("hex"); // 64-char hex string
  const tokenBuf = Buffer.from(rawToken, "hex");
  const hashed = createHash("sha256").update(tokenBuf).digest("hex");

  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

  await query(
    "INSERT INTO admin_sessions (admin_user_id, token_hash, created_at, expires_at, last_used_at, ip, user_agent) VALUES (?, ?, NOW(), ?, NOW(), ?, ?)",
    [adminId, hashed, expiresAt.toISOString(), null, null],
  );

  return rawToken;
}

// ---------- verifySession ----------

export async function verifySession(): Promise<{ adminId: number } | null> {
  const name = cookieName();
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(name)?.value ?? "";

  if (!rawCookie) return null;

  // Hash the cookie value and look it up
  const crypto = require("crypto");
  const tokenBuf = Buffer.from(rawCookie, "utf8");
  const hashed = createHash("sha256").update(tokenBuf).digest("hex");

  const row = await findSession(hashed);
  if (!row) return null;

  // Check expiry
  const expires = new Date(row.expires_at);
  if (expires < new Date()) {
    // Expired — purge
    await query("DELETE FROM admin_sessions WHERE id = ?", [row.id]);
    return null;
  }

  // Refresh last_used_at
  await query("UPDATE admin_sessions SET last_used_at = NOW() WHERE id = ?", [row.id]);

  return { adminId: row.admin_user_id };
}

// ---------- destroySession ----------

export async function destroySession() {
  const verify = await verifySession();
  if (verify) {
    await query("DELETE FROM admin_sessions WHERE admin_user_id = ?", [verify.adminId]);
  }
  // Clear the cookie
  const cookieStore = await cookies();
  cookieStore.set(cookieName(), "", {
    ...cookieOptions(),
    maxAge: 0,
  });
}

// ---------- rate limiting helpers ----------

async function checkRateLimit(email: string): Promise<{ allowed: boolean; resetMs: number }> {
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

  const rows = await query<{ id: number; created_at: string }>(
    "SELECT id, created_at FROM admin_login_attempts WHERE email = ? AND created_at > ?",
    [email, fifteenMinAgo.toISOString()],
  );

  const total = rows.length;

  if (total >= 5) {
    // Block for 15 minutes from the oldest attempt
    const oldest = rows[rows.length - 1];
    const oldestTime = oldest ? new Date(oldest.created_at) : fifteenMinAgo;
    const resetMs = Math.max(15 * 60 * 1000 - (Date.now() - oldestTime.getTime()), 0);
    return { allowed: false, resetMs };
  }

  return { allowed: true, resetMs: 0 };
}

// ---------- Server Action: attempt login ----------

export async function attemptLogin(
  email: string,
  password: string,
): Promise<{ success: boolean; message: string; adminId?: number; blockUntil?: number }> {
  const lowerEmail = email.toLowerCase().trim();

  // Rate limit check
  const limited = await checkRateLimit(lowerEmail);
  if (!limited.allowed) {
    // Still record the attempt but return block message
    await recordAttempt(lowerEmail, null);
    return {
      success: false,
      message: "Invalid email or password",
      blockUntil: limited.resetMs,
    };
  }

  // Look up the admin user
  const users = await query<{ id: number; email: string; password_hash: string }>(
    "SELECT id, email, password_hash FROM admin_users WHERE email = ? LIMIT 1",
    [lowerEmail],
  );

  // Constant-time compare even when user doesn't exist
  // Compare against a dummy hash so timing never reveals if email exists
  const dummyHash = "$2b$12$dummydummydummydummydummydummydummydummy";
  const storedHash = users.length > 0 ? users[0].password_hash : dummyHash;

  // bcrypt compare — constant time, returns false if hash is wrong or user doesn't exist
  const bcrypt = require("bcryptjs");
  const passwordMatch = await new Promise<boolean>((resolve) => {
    bcrypt.compare(password, storedHash, (err: Error | null, res: boolean) => {
      if (err) resolve(false);
      else resolve(res);
    });
  });

  // Record attempt regardless
  await recordAttempt(lowerEmail, null);

  if (!users.length || !passwordMatch) {
    return {
      success: false,
      message: "Invalid email or password",
    };
  }

  // Success: create session, return adminId
  const rawToken = await createSession(users[0].id);

  // Set the session cookie
  const cookieStore = await cookies();
  cookieStore.set(cookieName(), rawToken, cookieOptions());

  // On success, purge old attempts for this email
  await cleanupOldAttempts(lowerEmail);

  return {
    success: true,
    message: "Signed in successfully",
    adminId: users[0].id,
  };
}