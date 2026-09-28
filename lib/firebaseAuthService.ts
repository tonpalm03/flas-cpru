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

// 1. Sign In with Email & Password
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;
  
  // Fetch user profile from Firestore
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }

  // Fallback default profile if not yet created in Firestore
  const defaultProfile: UserProfile = {
    id: user.uid,
    name: user.displayName || email.split("@")[0],
    email: user.email || email,
    role: "admin",
    roleTitle: "เจ้าหน้าที่ธุรการและสารบรรณ",
    department: "สำนักงานคณบดี คณะศิลปศาสตร์และวิทยาศาสตร์"
  };
  await setDoc(userDocRef, { ...defaultProfile, createdAt: serverTimestamp() });
  return defaultProfile;
}

// 2. Register New User with Role
export async function registerWithEmail(
  name: string, 
  email: string, 
  pass: string, 
  role: UserRole, 
  department: string
): Promise<UserProfile> {
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
