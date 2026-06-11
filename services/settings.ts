import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { CompanySettings } from "@/lib/types"

const DOC_PATH = "settings/company"

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: "Your Company Name",
  address: "123 Business Street, City, State - 123456",
  phone: "+1 234 567 8900",
  email: "info@company.com",
  website: "www.company.com",
  logoUrl: "",
  logoPublicId: "",
  footerText: "This is a computer-generated document.",
}

export async function getCompanySettings() {
  const docSnap = await getDoc(doc(db, DOC_PATH))
  if (!docSnap.exists()) return DEFAULT_SETTINGS
  return docSnap.data() as CompanySettings
}

export async function updateCompanySettings(data: Partial<CompanySettings>) {
  const existing = await getCompanySettings()
  await setDoc(doc(db, DOC_PATH), { ...existing, ...data, updatedAt: Timestamp.now() }, { merge: true })
}
