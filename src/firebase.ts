import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect, 
  getRedirectResult,
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  type User,
  type Auth
} from 'firebase/auth';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
  databaseId?: string;
}

const CUSTOM_CONFIG_KEY = 'custom_firebase_config';

export function getCustomFirebaseConfig(): FirebaseCustomConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CUSTOM_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveCustomFirebaseConfig(config: FirebaseCustomConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_CONFIG_KEY, JSON.stringify(config));
  window.location.reload();
}

export function resetCustomFirebaseConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CUSTOM_CONFIG_KEY);
  window.location.reload();
}

// Resolve active configuration: Custom Admin Storage -> VITE Environment Variables -> Fallback Project
export function resolveFirebaseConfig(): { config: FirebaseCustomConfig; source: 'custom' | 'env' | 'fallback' } {
  // Check if Admin set a custom config in the browser
  const customConfig = getCustomFirebaseConfig();
  if (customConfig && customConfig.apiKey && customConfig.projectId) {
    const rawDbId = (customConfig.databaseId || '').trim();
    const rawAppId = (customConfig.appId || '').trim();
    const isValidDbId = Boolean(
      rawDbId &&
      rawDbId !== '(default)' &&
      !rawDbId.includes(':') &&
      rawDbId !== rawAppId
    );
    return {
      config: {
        ...customConfig,
        databaseId: isValidDbId ? rawDbId : '(default)',
      },
      source: 'custom'
    };
  }

  // Check VITE environment variables (set in Vercel or .env)
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  // On Vercel custom domain, use thuquy10a13.vercel.app for first-party cookie isolation
  // In development/preview or localhost, use canonical firebaseapp.com for cross-origin postMessage
  const isVercelHost = typeof window !== 'undefined' && window.location.hostname === 'thuquy10a13.vercel.app';

  // Sanitize Database ID:
  // In Firebase, database IDs cannot contain colons (App ID format 1:261664509449:web:...).
  // Default database in Firestore is '(default)'.
  const rawDbId = (import.meta.env.VITE_FIREBASE_DATABASE_ID || '').trim();
  const rawAppId = (import.meta.env.VITE_FIREBASE_APP_ID || '').trim();
  const isValidCustomDbId = Boolean(
    rawDbId &&
    rawDbId !== '(default)' &&
    !rawDbId.includes(':') &&
    rawDbId !== rawAppId
  );
  const safeDatabaseId = isValidCustomDbId ? rawDbId : '(default)';

  if (envApiKey && envProjectId) {
    return {
      config: {
        apiKey: envApiKey,
        authDomain: isVercelHost 
          ? (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'thuquy10a13.vercel.app')
          : (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.includes('firebaseapp.com') ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : `${envProjectId}.firebaseapp.com`),
        projectId: envProjectId,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.firebasestorage.app`,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: rawAppId || '',
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-LSJEQLNCTX',
        databaseId: safeDatabaseId,
      },
      source: 'env'
    };
  }

  // Fallback to active cloud project configuration
  return {
    config: {
      projectId: "webthuquylop",
      appId: "1:261664509449:web:0abcdefeedfbab80df32d8",
      apiKey: "AIzaSyBZ-fX9a_t_zsWSK5c-wHLWuhvXDT6KVkI",
      authDomain: isVercelHost ? "thuquy10a13.vercel.app" : "webthuquylop.firebaseapp.com",
      storageBucket: "webthuquylop.firebasestorage.app",
      messagingSenderId: "261664509449",
      measurementId: "G-LSJEQLNCTX",
      databaseId: "(default)",
    },
    source: 'fallback'
  };
}

const activeInfo = resolveFirebaseConfig();
export const activeFirebaseConfig = activeInfo.config;
export const firebaseConfigSource = activeInfo.source;

// 1. Initialize Firebase App
export const app: FirebaseApp = getApps().length > 0 
  ? getApp() 
  : initializeApp(activeFirebaseConfig);

// Initialize Analytics safely
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && activeFirebaseConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (err) {
        console.warn('Analytics initialization skipped:', err);
      }
    }
  }).catch(() => {});
}

// 2. Initialize Auth & Google Provider
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// 3. Initialize Firestore
// Only supply second argument if it is a validated custom non-default database ID
export const db: Firestore = (activeFirebaseConfig.databaseId && activeFirebaseConfig.databaseId !== '(default)')
  ? getFirestore(app, activeFirebaseConfig.databaseId)
  : getFirestore(app);

// 4. Initialize Firebase Storage for photos & receipt attachments
export const storage: FirebaseStorage = getStorage(app);

/**
 * Upload an image file/blob to Firebase Storage and return its public download URL.
 * Never stores base64 data in Firestore.
 */
export async function uploadReceiptToFirebaseStorage(
  fileOrBlob: Blob | File,
  filenamePrefix: string = 'receipt'
): Promise<string> {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const ext = fileOrBlob.type === 'image/png' ? 'png' : 'jpg';
  const cleanPrefix = filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  const storagePath = `receipts/${cleanPrefix}_${timestamp}_${randomSuffix}.${ext}`;
  
  const storageRef = ref(storage, storagePath);
  const metadata = {
    contentType: fileOrBlob.type || 'image/jpeg',
  };

  const snapshot = await uploadBytes(storageRef, fileOrBlob, metadata);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}

// 5. Auth helper functions
export { getRedirectResult };

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/popup-blocked') {
      console.warn('Google popup blocked by browser/ad-blocker, falling back to signInWithRedirect...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
};

export async function signOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.warn('Sign Out Warning:', error);
  }
}
