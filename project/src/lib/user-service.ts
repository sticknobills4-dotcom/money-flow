
import { doc, getDoc, setDoc, updateDoc, Firestore, serverTimestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: any;
  updatedAt: any;
}

/**
 * Creates or updates a user profile in Firestore.
 */
export async function createUserProfile(db: Firestore, userId: string, data: { name: string; email: string }) {
  const userRef = doc(db, 'users', userId);
  const profile: UserProfile = {
    id: userId,
    name: data.name,
    email: data.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(userRef, profile, { merge: true });
}

/**
 * Gets a user profile from Firestore.
 */
export async function getUserProfile(db: Firestore, userId: string) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
