import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { GeneratedDocument, UploadedDocument } from "@/lib/types"

const GENERATED_COLLECTION = "generated_documents"
const UPLOADED_COLLECTION = "uploaded_documents"

export async function getGeneratedDocuments(employeeId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const constraints: any[] = [orderBy("generatedAt", "desc")]
  if (employeeId) {
    constraints.push(where("employeeId", "==", employeeId))
  }
  const q = query(collection(db, GENERATED_COLLECTION), ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GeneratedDocument))
}

export async function saveGeneratedDocument(data: Omit<GeneratedDocument, "id" | "generatedAt">) {
  const docRef = await addDoc(collection(db, GENERATED_COLLECTION), {
    ...data,
    generatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function getUploadedDocuments(employeeId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const constraints: any[] = [orderBy("uploadedAt", "desc")]
  if (employeeId) {
    constraints.push(where("employeeId", "==", employeeId))
  }
  const q = query(collection(db, UPLOADED_COLLECTION), ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UploadedDocument))
}

export async function saveUploadedDocument(data: Omit<UploadedDocument, "id" | "uploadedAt">) {
  const docRef = await addDoc(collection(db, UPLOADED_COLLECTION), {
    ...data,
    uploadedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function deleteUploadedDocument(id: string) {
  const { deleteDoc } = await import("firebase/firestore")
  await deleteDoc(doc(db, UPLOADED_COLLECTION, id))
}
