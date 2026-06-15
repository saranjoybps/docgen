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
  lastWorkingDate: Timestamp | null
  status: EmployeeStatus
  address: string
  companyId: string
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
  lastWorkingDate: string
  status: EmployeeStatus
  address: string
  companyId: string
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
  | "aadhaar_card"
  | "pan_card"
  | "passport"
  | "passport_photo"
  | "updated_resume"
  | "marksheet_10th"
  | "marksheet_12th"
  | "degree_certificate"
  | "semester_marksheets"
  | "professional_certifications"
  | "previous_company_offer_letter"
  | "promotion_letter"
  | "latest_increment_letter"
  | "form_16"
  | "salary_bank_statement"
  | "uan_number"
  | "pf_details"
  | "esic_details"
  | "bank_account_proof"
  | "address_proof"
  | "emergency_contact"
  | "background_verification"
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
  aadhaar_card: "Aadhaar Card",
  pan_card: "PAN Card",
  passport: "Passport",
  passport_photo: "Passport-size Photographs",
  updated_resume: "Updated Resume",
  marksheet_10th: "10th Mark Sheet/Certificate",
  marksheet_12th: "12th Mark Sheet/Certificate",
  degree_certificate: "Degree Certificate",
  semester_marksheets: "Semester Mark Sheets",
  professional_certifications: "Professional Certifications",
  previous_company_offer_letter: "Previous Company Offer Letter",
  promotion_letter: "Promotion Letter",
  latest_increment_letter: "Latest Increment Letter",
  form_16: "Form 16",
  salary_bank_statement: "Salary Bank Statement",
  uan_number: "UAN Number",
  pf_details: "PF Details/Passbook",
  esic_details: "ESIC Details",
  bank_account_proof: "Bank Account Proof",
  address_proof: "Address Proof",
  emergency_contact: "Emergency Contact Details",
  background_verification: "Background Verification Details",
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
  registrationNumber: string
  gstNumber: string
  logoUrl: string
  logoPublicId: string
  signatureUrl: string
  signaturePublicId: string
  footerText: string
  primaryColor?: string
  secondaryColor?: string
  bodyColor?: string
  mutedColor?: string
  watermarkEnabled?: boolean
  showPageNumbers?: boolean
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
  bodyFontSize?: number
  titleFontSize?: number
  watermarkOpacity?: number
}

export interface DocumentDesign {
  companyName: string
  address: string
  phone: string
  email: string
  website: string
  registrationNumber: string
  gstNumber: string
  logoUrl: string
  logoPublicId: string
  signatureUrl: string
  signaturePublicId: string
  footerText: string
  primaryColor: string
  secondaryColor: string
  bodyColor: string
  mutedColor: string
  watermarkEnabled: boolean
  showPageNumbers: boolean
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  bodyFontSize: number
  titleFontSize: number
  watermarkOpacity: number
}
