import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Employee, EmployeeFormData, EmployeeStatus } from "@/lib/types"

const COLLECTION = "employees"

export async function getEmployees(filters?: { status?: EmployeeStatus }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const constraints: any[] = [orderBy("createdAt", "desc")]
  if (filters?.status) {
    constraints.push(where("status", "==", filters.status))
  }
  const q = query(collection(db, COLLECTION), ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Employee))
}

export async function getEmployee(id: string) {
  const docSnap = await getDoc(doc(db, COLLECTION, id))
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() } as Employee
}

export async function addEmployee(data: EmployeeFormData) {
  const now = Timestamp.now()
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    dateOfJoining: Timestamp.fromDate(new Date(data.dateOfJoining)),
    dateOfBirth: data.dateOfBirth ? Timestamp.fromDate(new Date(data.dateOfBirth)) : null,
    createdAt: now,
    updatedAt: now,
  })
  return docRef.id
}

export async function updateEmployee(id: string, data: Partial<EmployeeFormData>) {
  const updateData: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() }
  if (data.dateOfJoining) {
    updateData.dateOfJoining = Timestamp.fromDate(new Date(data.dateOfJoining))
  }
  if (data.dateOfBirth) {
    updateData.dateOfBirth = Timestamp.fromDate(new Date(data.dateOfBirth))
  }
  await updateDoc(doc(db, COLLECTION, id), updateData)
}

export async function deleteEmployee(id: string) {
  await deleteDoc(doc(db, COLLECTION, id))
}

export async function updateEmployeeStatus(id: string, status: EmployeeStatus) {
  await updateDoc(doc(db, COLLECTION, id), { status, updatedAt: Timestamp.now() })
}
