import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { CompanySettings } from "@/lib/types"

const COLLECTION = "company_settings"

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: "Your Company Name",
  address: "123 Business Street, City, State - 123456",
  phone: "+1 234 567 8900",
  email: "info@company.com",
  website: "www.company.com",
  registrationNumber: "",
  gstNumber: "",
  logoUrl: "",
  logoPublicId: "",
  signatureUrl: "",
  signaturePublicId: "",
  footerText: "This is a computer-generated document.",
  primaryColor: "#1e3a5f",
  secondaryColor: "#2563eb",
  bodyColor: "#1e293b",
  mutedColor: "#64748b",
  watermarkEnabled: true,
  showPageNumbers: true,
  marginTop: 80,
  marginBottom: 60,
  marginLeft: 40,
  marginRight: 40,
  bodyFontSize: 10,
  titleFontSize: 16,
  watermarkOpacity: 0.04,
}

export async function listCompanySettings(): Promise<(CompanySettings & { id: string })[]> {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CompanySettings & { id: string }))
}

export async function getCompanySettings(id: string): Promise<(CompanySettings & { id: string }) | null> {
  const docSnap = await getDoc(doc(db, COLLECTION, id))
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() } as CompanySettings & { id: string }
}

export async function addCompanySettings(data: Partial<CompanySettings>) {
  const now = Timestamp.now()
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...DEFAULT_SETTINGS,
    ...data,
    createdAt: now,
    updatedAt: now,
  })
  return docRef.id
}

export async function updateCompanySettings(id: string, data: Partial<CompanySettings>) {
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: Timestamp.now() })
}

export async function deleteCompanySettings(id: string) {
  await deleteDoc(doc(db, COLLECTION, id))
}
