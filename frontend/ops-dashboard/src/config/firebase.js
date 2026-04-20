import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// ── Runtime environment guard ─────────────────────────────────────────────
// In development, missing env vars produce a console warning and a null
// database export. The app will run fully on mock data (useMock = true in
// useZoneDensity.js). In production, inject real values via Cloud Run /
// Secret Manager so Firebase Realtime Database is live.
const REQUIRED_ENV = {
  VITE_FIREBASE_API_KEY:      import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_PROJECT_ID:   import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_DATABASE_URL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

const missing = Object.entries(REQUIRED_ENV)
  .filter(([, v]) => !v || v === "YOUR_KEY_HERE" || v === "REPLACE_ME")
  .map(([k]) => k);

let app      = null;
let database = null;

if (missing.length > 0) {
  console.warn(
    `[firebase.js] Missing env vars — running in DEMO/MOCK mode:\n  ${missing.join("\n  ")}\n` +
    `Copy .env.local.example → .env.local and fill in real values for live Firebase.`
  );
} else {
  const firebaseConfig = {
    apiKey:      REQUIRED_ENV.VITE_FIREBASE_API_KEY,
    projectId:   REQUIRED_ENV.VITE_FIREBASE_PROJECT_ID,
    databaseURL: REQUIRED_ENV.VITE_FIREBASE_DATABASE_URL,
  };
  app      = initializeApp(firebaseConfig);
  database = getDatabase(app);
}

export { app, database };
