import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-key",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://mock.firebaseio.com",
};

export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
