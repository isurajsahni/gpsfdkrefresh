import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// All values read from Vite env (VITE_* is the only prefix Vite exposes to the
// browser). Firebase Web "API keys" identify the project rather than authorize
// requests — the real lock is Firebase Security Rules + Auth domain allowlist
// in Firebase Console. We still keep them in env so the repo isn't flagged by
// GitHub secret scanning and so the key can be rotated without a code change.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Fail loudly during dev if env is missing — otherwise initializeApp throws a
// less helpful "auth/invalid-api-key" later, at the worst possible moment.
if (!firebaseConfig.apiKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Firebase config missing. Set VITE_FIREBASE_API_KEY (and the rest) in client/.env'
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
