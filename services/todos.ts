import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Todo } from "@/lib/types"

const COLLECTION = "todos"

export async function getTodos() {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Todo))
}

export async function getTodo(id: string) {
  const docSnap = await getDoc(doc(db, COLLECTION, id))
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() } as Todo
}

export async function addTodo(title: string) {
  const now = Timestamp.now()
  const docRef = await addDoc(collection(db, COLLECTION), {
    title,
    completed: false,
    createdAt: now,
    updatedAt: now,
  })
  return docRef.id
}

export async function updateTodo(id: string, title: string) {
  await updateDoc(doc(db, COLLECTION, id), { title, updatedAt: Timestamp.now() })
}

export async function toggleTodo(id: string, completed: boolean) {
  await updateDoc(doc(db, COLLECTION, id), { completed, updatedAt: Timestamp.now() })
}

export async function deleteTodo(id: string) {
  await deleteDoc(doc(db, COLLECTION, id))
}
