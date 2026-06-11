import type { Timestamp } from "firebase/firestore"

export type EmployeeStatus = "active" | "inactive" | "terminated" | "resigned"

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  designation: string
  dateOfJoining: Timestamp
  dateOfBirth: Timestamp | null
  status: EmployeeStatus
  address: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface EmployeeFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  designation: string
  dateOfJoining: string
  dateOfBirth: string
  status: EmployeeStatus
  address: string
}

export interface SalaryAllowance {
  label: string
  amount: number
}

export interface SalaryDeduction {
  label: string
  amount: number
}

export interface SalaryStructure {
  id: string
  employeeId: string
  basicPay: number
  hra: number
  da: number
  otherAllowances: SalaryAllowance[]
  grossSalary: number
  deductions: SalaryDeduction[]
  netSalary: number
  effectiveFrom: Timestamp
  effectiveTo: Timestamp | null
  isActive: boolean
  createdAt: Timestamp
}

export interface SalaryFormData {
  employeeId: string
  basicPay: number
  hra: number
  da: number
  otherAllowances: SalaryAllowance[]
  deductions: SalaryDeduction[]
  effectiveFrom: string
}

export type DocumentType =
  | "offer_letter"
  | "increment_letter"
  | "experience_letter"
  | "relieving_letter"
  | "payslip"

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  offer_letter: "Offer Letter",
  increment_letter: "Increment Letter",
  experience_letter: "Experience Letter",
  relieving_letter: "Relieving Letter",
  payslip: "Payslip",
}

export interface DocumentTemplate {
  id: string
  name: string
  type: DocumentType
  content: string
  variables: string[]
  isDefault: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface GeneratedDocument {
  id: string
  employeeId: string
  templateId: string
  type: DocumentType
  pdfUrl: string
  cloudinaryPublicId: string
  metadata: Record<string, string>
  generatedAt: Timestamp
}

export interface UploadedDocument {
  id: string
  employeeId: string
  type: DocumentType | "other"
  originalFileName: string
  cloudinaryUrl: string
  cloudinaryPublicId: string
  uploadedAt: Timestamp
  uploadedBy: string
}

export interface CompanySettings {
  companyName: string
  address: string
  phone: string
  email: string
  website: string
  logoUrl: string
  logoPublicId: string
  footerText: string
}
