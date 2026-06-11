import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { DocumentTemplate, DocumentType } from "@/lib/types"

const COLLECTION = "document_templates"

const DEFAULT_TEMPLATES: Omit<DocumentTemplate, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Offer Letter",
    type: "offer_letter",
    content: `Date: {date}

To,
{employeeName}
{employeeAddress}

Subject: Offer of Employment - {employeeName}

Dear {employeeName},

We are pleased to offer you the position of {designation} in the {department} department at {companyName}.

Your compensation will be as follows:
- Basic Pay: {basicPay}
- HRA: {hra}
- DA: {da}
- Gross Salary: {grossSalary}
- Net Salary: {netSalary}

Your expected date of joining is {dateOfJoining}.

We look forward to welcoming you to our team.

Sincerely,
{companyName}`,
    variables: [
      "date", "employeeName", "employeeAddress", "designation", "department",
      "companyName", "basicPay", "hra", "da", "grossSalary", "netSalary", "dateOfJoining",
    ],
    isDefault: true,
  },
  {
    name: "Increment Letter",
    type: "increment_letter",
    content: `Date: {date}

To,
{employeeName}
{designation}, {department}

Subject: Salary Increment Letter

Dear {employeeName},

We are pleased to inform you that based on your performance, your salary has been revised effective from {effectiveDate}.

Your revised salary structure:
- Basic Pay: {basicPay}
- HRA: {hra}
- DA: {da}
- Gross Salary: {grossSalary}
- Net Salary: {netSalary}

We appreciate your contributions to {companyName} and look forward to your continued growth with us.

Sincerely,
{companyName}`,
    variables: [
      "date", "employeeName", "designation", "department",
      "companyName", "basicPay", "hra", "da", "grossSalary", "netSalary", "effectiveDate",
    ],
    isDefault: true,
  },
  {
    name: "Experience Letter",
    type: "experience_letter",
    content: `Date: {date}

To Whom It May Concern,

This is to certify that {employeeName} worked with {companyName} from {dateOfJoining} to {relievingDate}.

During their tenure, {employeeName} served as {designation} in the {department} department and demonstrated excellent skills in their role.

{employeeName} was known for their dedication, professionalism, and contribution to the organization.

We wish {employeeName} the very best in their future endeavors.

Sincerely,
{companyName}`,
    variables: [
      "date", "employeeName", "designation", "department",
      "companyName", "dateOfJoining", "relievingDate",
    ],
    isDefault: true,
  },
  {
    name: "Relieving Letter",
    type: "relieving_letter",
    content: `Date: {date}

To,
{employeeName}
{designation}, {department}

Subject: Relieving Letter

Dear {employeeName},

This is to confirm that your resignation from the position of {designation} at {companyName} has been accepted, and you are relieved from your duties effective {relievingDate}.

We thank you for your contributions during your tenure from {dateOfJoining} to {relievingDate}.

You have cleared all your responsibilities and there are no dues pending from your side.

We wish you success in your future endeavors.

Sincerely,
{companyName}`,
    variables: [
      "date", "employeeName", "designation", "department",
      "companyName", "dateOfJoining", "relievingDate",
    ],
    isDefault: true,
  },
  {
    name: "Payslip",
    type: "payslip",
    content: `PAYSLIP
{companyName}

Employee Name: {employeeName}
Designation: {designation}
Department: {department}
Pay Period: {payPeriod}

Earnings:
- Basic Pay: {basicPay}
- HRA: {hra}
- DA: {da}
- Other Allowances: {otherAllowances}
- Gross Salary: {grossSalary}

Deductions:
- {deductions}

Net Salary: {netSalary}`,
    variables: [
      "employeeName", "designation", "department", "companyName",
      "basicPay", "hra", "da", "otherAllowances", "grossSalary",
      "deductions", "netSalary", "payPeriod",
    ],
    isDefault: true,
  },
]

export async function seedDefaultTemplates() {
  const existing = await getTemplates()
  const existingTypes = new Set(existing.map((t) => t.type))
  const toSeed = DEFAULT_TEMPLATES.filter((t) => !existingTypes.has(t.type))

  for (const template of toSeed) {
    await addDoc(collection(db, COLLECTION), {
      ...template,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  }
}

export async function getTemplates(type?: DocumentType) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const constraints: any[] = []
  if (type) {
    constraints.push(where("type", "==", type))
  }
  const q = query(collection(db, COLLECTION), ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DocumentTemplate))
}

export async function getTemplate(id: string) {
  const docSnap = await getDoc(doc(db, COLLECTION, id))
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() } as DocumentTemplate
}

export async function addTemplate(data: Omit<DocumentTemplate, "id" | "createdAt" | "updatedAt">) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function updateTemplate(id: string, data: Partial<DocumentTemplate>) {
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: Timestamp.now() })
}
