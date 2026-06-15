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
import type { SalaryStructure, SalaryFormData } from "@/lib/types"

const COLLECTION = "salary_structures"

export async function getSalaryStructures(employeeId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const constraints: any[] = employeeId ? [where("employeeId", "==", employeeId)] : [orderBy("effectiveFrom", "desc")]
  const q = query(collection(db, COLLECTION), ...constraints)
  const snapshot = await getDocs(q)
  const results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SalaryStructure))
  if (employeeId) {
    results.sort((a, b) => b.effectiveFrom.toMillis() - a.effectiveFrom.toMillis())
  }
  return results
}

export async function getActiveSalary(employeeId: string) {
  const q = query(
    collection(db, COLLECTION),
    where("employeeId", "==", employeeId),
    where("isActive", "==", true),
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const sorted = snapshot.docs.sort((a, b) => {
    const aTime = a.data().effectiveFrom?.toMillis() || 0
    const bTime = b.data().effectiveFrom?.toMillis() || 0
    return bTime - aTime
  })
  return { id: sorted[0].id, ...sorted[0].data() } as SalaryStructure
}

export async function getSalaryStructure(id: string) {
  const docSnap = await getDoc(doc(db, COLLECTION, id))
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() } as SalaryStructure
}

function calcGrossEarnings(data: SalaryFormData) {
  const otherTotal = data.otherAllowances.reduce((s, a) => s + a.amount, 0)
  return data.basicPay + data.da + data.hra + data.conveyanceAllowance + data.medicalAllowance + data.specialAllowance + otherTotal
}

function calcTotalDeductions(data: SalaryFormData) {
  const otherTotal = data.otherDeductions.reduce((s, d) => s + d.amount, 0)
  return data.pf + data.esi + data.professionalTax + data.incomeTax + otherTotal
}

export async function addSalaryStructure(data: SalaryFormData) {
  const grossEarnings = calcGrossEarnings(data)
  const totalDeductions = calcTotalDeductions(data)
  const netSalary = grossEarnings - totalDeductions
  const employerPf = data.pf
  const employerEsi = data.esi * 3.25
  const ctc = (grossEarnings + employerPf + employerEsi) * 12 + data.gratuity

  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    grossEarnings,
    totalDeductions,
    netSalary,
    employerPf,
    employerEsi,
    ctc,
    effectiveFrom: Timestamp.fromDate(new Date(data.effectiveFrom)),
    effectiveTo: null,
    isActive: true,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export async function updateSalaryStructure(id: string, data: Partial<SalaryFormData>) {
  const updateData: Record<string, unknown> = { ...data }
  if (data.effectiveFrom) {
    updateData.effectiveFrom = Timestamp.fromDate(new Date(data.effectiveFrom))
  }
  const current = await getSalaryStructure(id)
  if (current) {
    const merged: SalaryFormData = {
      employeeId: data.employeeId ?? current.employeeId,
      basicPay: data.basicPay ?? current.basicPay,
      da: data.da ?? current.da,
      hra: data.hra ?? current.hra,
      conveyanceAllowance: data.conveyanceAllowance ?? current.conveyanceAllowance,
      medicalAllowance: data.medicalAllowance ?? current.medicalAllowance,
      specialAllowance: data.specialAllowance ?? current.specialAllowance,
      otherAllowances: data.otherAllowances ?? current.otherAllowances,
      pf: data.pf ?? current.pf,
      esi: data.esi ?? current.esi,
      professionalTax: data.professionalTax ?? current.professionalTax,
      incomeTax: data.incomeTax ?? current.incomeTax,
      otherDeductions: data.otherDeductions ?? current.otherDeductions,
      employerPf: data.employerPf ?? current.employerPf,
      employerEsi: data.employerEsi ?? current.employerEsi,
      gratuity: data.gratuity ?? current.gratuity,
      effectiveFrom: data.effectiveFrom ?? "",
    }
    const grossEarnings = calcGrossEarnings(merged)
    const totalDeductions = calcTotalDeductions(merged)
    updateData.grossEarnings = grossEarnings
    updateData.totalDeductions = totalDeductions
    updateData.netSalary = grossEarnings - totalDeductions
    updateData.employerPf = merged.pf
    updateData.employerEsi = merged.esi * 3.25
    updateData.ctc = (grossEarnings + merged.pf + (merged.esi * 3.25)) * 12 + merged.gratuity
  }
  await updateDoc(doc(db, COLLECTION, id), updateData)
}

export async function deactivateSalary(id: string) {
  await updateDoc(doc(db, COLLECTION, id), { isActive: false, effectiveTo: Timestamp.now() })
}

export async function deleteSalaryStructure(id: string) {
  await deleteDoc(doc(db, COLLECTION, id))
}
