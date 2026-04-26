#!/usr/bin/env node
/**
 * Preflight check — verifies your .env has the required VITE_SUPABASE_* values
 * and that the Supabase project responds before you `npm run dev` / `npm run build`.
 *
 * Usage:
 *   npm run preflight
 *
 * Exits 0 on success, 1 on any failure.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

const ok = (msg) => console.log(`${GREEN}✓${RESET} ${msg}`);
const warn = (msg) => console.log(`${YELLOW}⚠${RESET}  ${msg}`);
const fail = (msg) => console.log(`${RED}✗${RESET} ${msg}`);
const info = (msg) => console.log(`${CYAN}ℹ${RESET}  ${msg}`);
const heading = (msg) => console.log(`\n${BOLD}${msg}${RESET}`);

const REQUIRED_VARS = [
  "VITE_SUPABASE_PROJECT_ID",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
];

const errors = [];
const warnings = [];

// ---------------------------------------------------------------------------
// 1. Locate and parse .env
// ---------------------------------------------------------------------------
heading("1. Loading .env");

const envPath = resolve(process.cwd(), ".env");
const templatePath = resolve(process.cwd(), ".env.template");

if (!existsSync(envPath)) {
  fail(`No .env file found at ${envPath}`);
  if (existsSync(templatePath)) {
    info(`Run: ${BOLD}cp .env.template .env${RESET} and fill in your values`);
  }
  errors.push("missing .env");
} else {
  ok(`.env found`);
}

const env = {};
if (existsSync(envPath)) {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // strip optional surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
}

// ---------------------------------------------------------------------------
// 2. Required variables present and non-placeholder
// ---------------------------------------------------------------------------
heading("2. Required variables");

const PLACEHOLDERS = ["", "your-project-ref", "your-anon-key", "https://your-project-ref.supabase.co"];

for (const key of REQUIRED_VARS) {
  const value = env[key];
  if (value === undefined) {
    fail(`${key} is missing`);
    errors.push(`${key} missing`);
    continue;
  }
  if (PLACEHOLDERS.includes(value)) {
    fail(`${key} is still a placeholder (${DIM}${value}${RESET})`);
    errors.push(`${key} placeholder`);
    continue;
  }
  ok(`${key} set`);
}

// ---------------------------------------------------------------------------
// 3. Format checks
// ---------------------------------------------------------------------------
heading("3. Format checks");

const url = env.VITE_SUPABASE_URL;
const projectId = env.VITE_SUPABASE_PROJECT_ID;
const anonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (url) {
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)) {
    warn(`VITE_SUPABASE_URL doesn't match the expected pattern (https://<ref>.supabase.co)`);
    warnings.push("url format");
  } else {
    ok(`VITE_SUPABASE_URL format looks valid`);
  }

  // Cross-check project ID is consistent with URL
  if (projectId) {
    const refFromUrl = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
    if (refFromUrl && refFromUrl !== projectId) {
      warn(
        `VITE_SUPABASE_PROJECT_ID (${projectId}) does not match the ref in VITE_SUPABASE_URL (${refFromUrl})`,
      );
      warnings.push("project id mismatch");
    } else if (refFromUrl) {
      ok(`Project ID matches URL ref`);
    }
  }
}

if (anonKey) {
  // Supabase JWTs start with "eyJ" and have three dot-separated parts
  const parts = anonKey.split(".");
  if (!anonKey.startsWith("eyJ") || parts.length !== 3) {
    warn(`VITE_SUPABASE_PUBLISHABLE_KEY does not look like a JWT (expected 3 dot-separated parts)`);
    warnings.push("anon key format");
  } else {
    try {
      const payload = JSON.parse(
        Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
      );
      if (payload.role && payload.role !== "anon") {
        fail(
          `VITE_SUPABASE_PUBLISHABLE_KEY has role "${payload.role}" — must be "anon". ` +
            `${BOLD}Never put service_role keys in the frontend.${RESET}`,
        );
        errors.push("wrong key role");
      } else {
        ok(`Anon key role verified`);
      }
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        fail(`VITE_SUPABASE_PUBLISHABLE_KEY has expired`);
        errors.push("anon key expired");
      }
    } catch {
      warn(`Could not decode anon key payload`);
      warnings.push("anon key decode");
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Live reachability check
// ---------------------------------------------------------------------------
heading("4. Supabase reachability");

if (errors.length === 0 && url && anonKey) {
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: anonKey },
    });
    if (res.ok) {
      ok(`Supabase project responded (${res.status})`);
    } else if (res.status === 401 || res.status === 403) {
      fail(`Supabase rejected the anon key (${res.status})`);
      errors.push("auth rejected");
    } else {
      warn(`Unexpected response from Supabase (${res.status})`);
      warnings.push("unexpected response");
    }
  } catch (err) {
    fail(`Could not reach ${url}: ${err.message}`);
    errors.push("network");
  }
} else {
  info(`Skipped (fix the issues above first)`);
}

// ---------------------------------------------------------------------------
// 5. Hardcoded client cross-check
// ---------------------------------------------------------------------------
heading("5. src/integrations/supabase/client.ts cross-check");

const clientPath = resolve(process.cwd(), "src/integrations/supabase/client.ts");
if (existsSync(clientPath) && url && anonKey) {
  const client = readFileSync(clientPath, "utf8");
  const urlMatch = client.includes(url);
  const keyMatch = client.includes(anonKey);
  if (!urlMatch || !keyMatch) {
    warn(
      `The hardcoded values in client.ts do not match your .env. ` +
        `Update both if you switched Supabase projects.`,
    );
    warnings.push("client mismatch");
  } else {
    ok(`Hardcoded client values match .env`);
  }
} else {
  info(`Skipped`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("");
if (errors.length === 0 && warnings.length === 0) {
  console.log(`${GREEN}${BOLD}✓ Preflight passed — you're good to start the app.${RESET}`);
  process.exit(0);
} else if (errors.length === 0) {
  console.log(
    `${YELLOW}${BOLD}⚠ Preflight passed with ${warnings.length} warning(s).${RESET} The app should start.`,
  );
  process.exit(0);
} else {
  console.log(
    `${RED}${BOLD}✗ Preflight failed with ${errors.length} error(s)${RESET}` +
      (warnings.length ? ` and ${warnings.length} warning(s)` : "") +
      `. Fix them before running the app.`,
  );
  process.exit(1);
}
