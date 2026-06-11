import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { SalaryStructure, SalaryFormData } from "@/lib/types"

const COLLECTION = "salary_structures"

export async function getSalaryStructures(employeeId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const constraints: any[] = [orderBy("effectiveFrom", "desc")]
  if (employeeId) {
    constraints.push(where("employeeId", "==", employeeId))
  }
  const q = query(collection(db, COLLECTION), ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SalaryStructure))
}

export async function getActiveSalary(employeeId: string) {
  const q = query(
    collection(db, COLLECTION),
    where("employeeId", "==", employeeId),
    where("isActive", "==", true),
    orderBy("effectiveFrom", "desc")
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as SalaryStructure
}

export async function getSalaryStructure(id: string) {
  const docSnap = await getDoc(doc(db, COLLECTION, id))
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() } as SalaryStructure
}

function calculateGross(data: SalaryFormData) {
  const allowancesTotal = data.otherAllowances.reduce((sum, a) => sum + a.amount, 0)
  return data.basicPay + data.hra + data.da + allowancesTotal
}

function calculateNet(gross: number, deductions: SalaryFormData["deductions"]) {
  const deductionsTotal = deductions.reduce((sum, d) => sum + d.amount, 0)
  return gross - deductionsTotal
}

export async function addSalaryStructure(data: SalaryFormData) {
  const grossSalary = calculateGross(data)
  const netSalary = calculateNet(grossSalary, data.deductions)

  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    grossSalary,
    netSalary,
    effectiveFrom: Timestamp.fromDate(new Date(data.effectiveFrom)),
    effectiveTo: null,
    isActive: true,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export async function updateSalaryStructure(id: string, data: Partial<SalaryFormData>) {
  const updateData: Record<string, unknown> = { ...data }
  if (data.basicPay !== undefined || data.hra !== undefined || data.da !== undefined || data.otherAllowances) {
    const current = await getSalaryStructure(id)
    if (current) {
      const merged = {
        basicPay: data.basicPay ?? current.basicPay,
        hra: data.hra ?? current.hra,
        da: data.da ?? current.da,
        otherAllowances: data.otherAllowances ?? current.otherAllowances,
        deductions: data.deductions ?? current.deductions,
      }
      const grossSalary = calculateGross(merged as SalaryFormData)
      updateData.grossSalary = grossSalary
      updateData.netSalary = calculateNet(grossSalary, merged.deductions)
    }
  }
  await updateDoc(doc(db, COLLECTION, id), updateData)
}

export async function deactivateSalary(id: string) {
  await updateDoc(doc(db, COLLECTION, id), { isActive: false, effectiveTo: Timestamp.now() })
}
