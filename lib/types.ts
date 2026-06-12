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
  da: number
  hra: number
  conveyanceAllowance: number
  medicalAllowance: number
  specialAllowance: number
  otherAllowances: SalaryAllowance[]
  grossEarnings: number
  pf: number
  esi: number
  professionalTax: number
  incomeTax: number
  otherDeductions: SalaryDeduction[]
  totalDeductions: number
  netSalary: number
  employerPf: number
  employerEsi: number
  gratuity: number
  ctc: number
  effectiveFrom: Timestamp
  effectiveTo: Timestamp | null
  isActive: boolean
  createdAt: Timestamp
}

export interface SalaryFormData {
  employeeId: string
  basicPay: number
  da: number
  hra: number
  conveyanceAllowance: number
  medicalAllowance: number
  specialAllowance: number
  otherAllowances: SalaryAllowance[]
  pf: number
  esi: number
  professionalTax: number
  incomeTax: number
  otherDeductions: SalaryDeduction[]
  employerPf: number
  employerEsi: number
  gratuity: number
  effectiveFrom: string
}

export type DocumentType =
  | "offer_letter"
  | "increment_letter"
  | "experience_letter"
  | "relieving_letter"
  | "payslip"
  | "appointment_letter"
  | "confirmation_letter"
  | "appraisal_letter"
  | "transfer_letter"
  | "warning_letter"
  | "show_cause"
  | "nda_agreement"
  | "employment_contract"
  | "bonus_letter"
  | "salary_revision"
  | "separation_letter"
  | "resignation_letter"
  | "leave_application"
  | "medical_certificate"
  | "id_card"
  | "other"

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  offer_letter: "Offer Letter",
  increment_letter: "Increment Letter",
  experience_letter: "Experience Letter",
  relieving_letter: "Relieving Letter",
  payslip: "Payslip",
  appointment_letter: "Appointment Letter",
  confirmation_letter: "Confirmation Letter",
  appraisal_letter: "Appraisal Letter",
  transfer_letter: "Transfer Letter",
  warning_letter: "Warning Letter",
  show_cause: "Show Cause Notice",
  nda_agreement: "NDA Agreement",
  employment_contract: "Employment Contract",
  bonus_letter: "Bonus Letter",
  salary_revision: "Salary Revision Letter",
  separation_letter: "Separation Letter",
  resignation_letter: "Resignation Letter",
  leave_application: "Leave Application",
  medical_certificate: "Medical Certificate",
  id_card: "ID Card",
  other: "Other",
}

export interface DocumentTemplate {
  id: string
  name: string
  content: string
  variables: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface GeneratedDocument {
  id: string
  employeeId: string
  templateId: string
  type: string
  pdfUrl: string
  cloudinaryPublicId: string
  metadata: Record<string, string>
  generatedAt: Timestamp
}

export interface UploadedDocument {
  id: string
  employeeId: string
  type: DocumentType
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
  signatureUrl: string
  signaturePublicId: string
  footerText: string
}
