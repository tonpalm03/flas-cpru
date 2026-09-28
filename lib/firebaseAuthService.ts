// Firebase Authentication & User Profile Service Layer
// Source of truth for Authentication, User Profile Sync, and Realtime Auth State

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile, UserRole, UserAccountStatus } from "./types";

// Helper to normalize username (e.g. "tonpalm03" -> "tonpalm03@cpru.ac.th")
export function normalizeUserEmail(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes("@")) {
    return trimmed;
  }
  return `${trimmed}@cpru.ac.th`;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "ผู้ดูแลระบบสารบรรณและธุรการกลาง",
  dean: "คณบดี / ผู้บริหารคณะ",
  lecturer: "อาจารย์ประจำสาขาวิชา",
  staff_finance: "เจ้าหน้าที่การเงินและงบประมาณ",
  staff_procurement: "เจ้าหน้าที่งานพัสดุและจัดซื้อ",
  staff_hr: "เจ้าหน้าที่งานบริหารบุคคล",
  staff_plan: "เจ้าหน้าที่งานแผนและยุทธศาสตร์",
  gov_officer: "เจ้าหน้าที่สายสนับสนุนทั่วไป"
};

// 1. Sign In
export async function loginWithEmail(identifier: string, pass: string): Promise<UserProfile> {
  const email = normalizeUserEmail(identifier);
  
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;
  
  // Fetch user profile from Firestore
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const data = userDoc.data() as UserProfile;
    if (data.status === "suspended") {
      await firebaseSignOut(auth);
      throw new Error("บัญชีผู้ใช้นี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ");
    }
    return data;
  }

  // Fallback initial profile if registering through direct auth
  const defaultProfile: UserProfile = {
    id: user.uid,
    name: user.displayName || email.split("@")[0],
    email: user.email || email,
    role: "lecturer",
    roleTitle: ROLE_LABELS.lecturer,
    department: "คณะศิลปศาสตร์และวิทยาศาสตร์",
    status: "active",
    createdAt: new Date().toISOString()
  };
  
  await setDoc(userDocRef, { ...defaultProfile, createdAt: serverTimestamp() });
  return defaultProfile;
}

// 2. Register New User
export async function registerWithEmail(
  name: string, 
  identifier: string, 
  pass: string, 
  role: UserRole, 
  department: string
): Promise<UserProfile> {
  const email = normalizeUserEmail(identifier);
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  const userProfile: UserProfile = {
    id: user.uid,
    name,
    email,
    role,
    roleTitle: ROLE_LABELS[role] || "บุคลากรคณะ",
    department: department || "คณะศิลปศาสตร์และวิทยาศาสตร์",
    status: "active",
    createdAt: new Date().toISOString()
  };

  // Save profile to Firestore users collection
  await setDoc(doc(db, "users", user.uid), {
    ...userProfile,
    createdAt: serverTimestamp()
  });

  return userProfile;
}

// 3. Subscribe to Auth State Changes (Source of Truth)
export function subscribeToAuthChanges(onUserChanged: (profile: UserProfile | null) => void): () => void {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      onUserChanged(null);
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        if (profile.status === "suspended") {
          await firebaseSignOut(auth);
          onUserChanged(null);
          return;
        }
        onUserChanged(profile);
      } else {
        const fallbackProfile: UserProfile = {
          id: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "ผู้ใช้งาน",
          email: user.email || "",
          role: "lecturer",
          roleTitle: ROLE_LABELS.lecturer,
          department: "คณะศิลปศาสตร์และวิทยาศาสตร์",
          status: "active",
          createdAt: new Date().toISOString()
        };
        onUserChanged(fallbackProfile);
      }
    } catch (err) {
      console.error("Error fetching user profile in auth subscriber:", err);
      onUserChanged(null);
    }
  });
}

// 4. Sign Out
export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}
