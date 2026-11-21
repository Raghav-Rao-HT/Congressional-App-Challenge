// Kept separate from firebase.ts on purpose: importing this file has no side effects, so main.tsx can check the
// configuration BEFORE anything that initialises Firebase (and throws) is loaded.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const ENV_NAMES: Record<keyof typeof firebaseConfig, string> = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
}

/** Names (never values) of the VITE_FIREBASE_* variables that were empty when this bundle was built. */
export function missingFirebaseConfig(): string[] {
  return (Object.keys(firebaseConfig) as (keyof typeof firebaseConfig)[])
    .filter((key) => !firebaseConfig[key])
    .map((key) => ENV_NAMES[key])
}
