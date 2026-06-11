import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { DocumentTemplate } from "@/lib/types"

const COLLECTION = "document_templates"

function extractVariables(content: string): string[] {
  const matches = content.match(/\{(\w+)\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.slice(1, -1)))]
}

export async function getTemplates() {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DocumentTemplate))
}

export async function getTemplate(id: string) {
  const docSnap = await getDoc(doc(db, COLLECTION, id))
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() } as DocumentTemplate
}

export async function addTemplate(data: { name: string; content: string }) {
  const variables = extractVariables(data.content)
  const docRef = await addDoc(collection(db, COLLECTION), {
    name: data.name,
    content: data.content,
    variables,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function updateTemplate(id: string, data: { name: string; content: string }) {
  const variables = extractVariables(data.content)
  await updateDoc(doc(db, COLLECTION, id), {
    name: data.name,
    content: data.content,
    variables,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteTemplate(id: string) {
  await deleteDoc(doc(db, COLLECTION, id))
}
