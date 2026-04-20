import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// ── Runtime environment guard ─────────────────────────────────────────────
// All three variables MUST be supplied via .env.local (dev) or
// Cloud Run / Secret Manager env injection (production).
// A missing variable throws at module load time so the problem is
// immediately visible instead of silently hitting Firebase with a fake key.
const REQUIRED_ENV = {
  VITE_FIREBASE_API_KEY:      import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_PROJECT_ID:   import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_DATABASE_URL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

const missing = Object.entries(REQUIRED_ENV)
  .filter(([, v]) => !v || v === "YOUR_KEY_HERE" || v === "REPLACE_ME")
  .map(([k]) => k);

if (missing.length > 0) {
  throw new Error(
    `[firebase.js] Missing required environment variables:\n  ${missing.join("\n  ")}\n` +
    `Copy .env.local.example → .env.local and fill in real values.\n` +
    `In Cloud Run, inject these as Secret Manager–backed env vars.`
  );
}

const firebaseConfig = {
  apiKey:      REQUIRED_ENV.VITE_FIREBASE_API_KEY,
  projectId:   REQUIRED_ENV.VITE_FIREBASE_PROJECT_ID,
  databaseURL: REQUIRED_ENV.VITE_FIREBASE_DATABASE_URL,
};

export const app      = initializeApp(firebaseConfig);
export const database = getDatabase(app);
