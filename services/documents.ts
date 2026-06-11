import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { GeneratedDocument, UploadedDocument } from "@/lib/types"

const GENERATED_COLLECTION = "generated_documents"
const UPLOADED_COLLECTION = "uploaded_documents"

export async function getGeneratedDocuments(employeeId?: string) {
  const constraints: any[] = []
  if (employeeId) {
    constraints.push(where("employeeId", "==", employeeId))
  }
  const q = query(collection(db, GENERATED_COLLECTION), ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as GeneratedDocument))
    .sort((a, b) => b.generatedAt.toMillis() - a.generatedAt.toMillis())
}

export async function saveGeneratedDocument(data: Omit<GeneratedDocument, "id" | "generatedAt">) {
  const docRef = await addDoc(collection(db, GENERATED_COLLECTION), {
    ...data,
    generatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function getUploadedDocuments(employeeId?: string) {
  const constraints: any[] = []
  if (employeeId) {
    constraints.push(where("employeeId", "==", employeeId))
  }
  const q = query(collection(db, UPLOADED_COLLECTION), ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as UploadedDocument))
    .sort((a, b) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis())
}

export async function getUploadedDocument(id: string) {
  const docSnap = await getDoc(doc(db, UPLOADED_COLLECTION, id))
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() } as UploadedDocument
}

export async function saveUploadedDocument(data: Omit<UploadedDocument, "id" | "uploadedAt">) {
  const docRef = await addDoc(collection(db, UPLOADED_COLLECTION), {
    ...data,
    uploadedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function updateUploadedDocument(id: string, data: Partial<UploadedDocument>) {
  await updateDoc(doc(db, UPLOADED_COLLECTION, id), data)
}

export async function deleteUploadedDocument(id: string) {
  const { deleteDoc } = await import("firebase/firestore")
  await deleteDoc(doc(db, UPLOADED_COLLECTION, id))
}
