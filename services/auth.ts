import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

export async function loginUser(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function logoutUser() {
  await signOut(auth)
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email)
}

export async function getUserProfile(uid: string) {
  const docSnap = await getDoc(doc(db, "users", uid))
  return docSnap.exists() ? docSnap.data() : null
}
