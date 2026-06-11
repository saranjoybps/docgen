import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth"
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

export async function registerUser(email: string, password: string, name: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(userCredential.user, { displayName: name })
  await setDoc(doc(db, "users", userCredential.user.uid), {
    email,
    name,
    role: "admin",
    createdAt: Timestamp.now(),
  })
  return userCredential.user
}

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
