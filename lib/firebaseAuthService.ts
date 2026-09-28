// Firebase Authentication & User Profile Service

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile, UserRole } from "./types";

// Helper to normalize username (e.g. "tonpalm03" -> "tonpalm03@cpru.ac.th")
export function normalizeUserEmail(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes("@")) {
    return trimmed;
  }
  return `${trimmed}@cpru.ac.th`;
}

// 1. Sign In (Supports both username e.g. "tonpalm03" and email e.g. "tonpalm03@cpru.ac.th")
export async function loginWithEmail(identifier: string, pass: string): Promise<UserProfile> {
  const email = normalizeUserEmail(identifier);
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    // Fetch user profile from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }

    // Default profile if first time
    const defaultProfile: UserProfile = {
      id: user.uid,
      name: identifier === "tonpalm03" ? "ผู้ดูแลระบบ (แอดมินธุรการ)" : user.displayName || identifier,
      email: user.email || email,
      role: "admin",
      roleTitle: "แอดมิน / เจ้าหน้าที่ธุรการและสารบรรณ",
      department: "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์"
    };
    await setDoc(userDocRef, { ...defaultProfile, createdAt: serverTimestamp() });
    return defaultProfile;
  } catch (err: any) {
    // If user is tonpalm03 and doesn't exist yet, auto-register seamless admin
    if (identifier.toLowerCase() === "tonpalm03" && pass === "palm2334" && (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found")) {
      try {
        return await registerWithEmail(
          "ผู้ดูแลระบบ (แอดมินธุรการ)",
          email,
          pass,
          "admin",
          "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์"
        );
      } catch (regErr) {
        console.warn("Auto admin create:", regErr);
      }
    }
    throw err;
  }
}

// 2. Register New User with Role
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

  const roleTitles: Record<UserRole, string> = {
    admin: "แอดมิน / เจ้าหน้าที่ธุรการและสารบรรณ",
    dean: "คณบดีคณะศิลปศาสตร์และวิทยาศาสตร์",
    lecturer: "อาจารย์ประจำสาขาวิชา",
    gov_officer: "พนักงานราชการ (สายสนับสนุน)"
  };

  const userProfile: UserProfile = {
    id: user.uid,
    name,
    email,
    role,
    roleTitle: roleTitles[role] || "บุคลากรคณะ",
    department
  };

  // Save profile to Firestore users collection
  await setDoc(doc(db, "users", user.uid), {
    ...userProfile,
    createdAt: serverTimestamp()
  });

  return userProfile;
}

// 3. Sign Out
export async function logoutUser() {
  await firebaseSignOut(auth);
}
