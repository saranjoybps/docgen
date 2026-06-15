import * as XLSX from "xlsx"
import { addEmployee } from "@/services/employees"
import type { EmployeeFormData, EmployeeStatus } from "@/lib/types"

const SAMPLE_HEADERS = [
  "firstName", "lastName", "email", "phone", "department",
  "designation", "dateOfJoining", "dateOfBirth", "status", "address", "company",
]

const SAMPLE_ROWS: Record<string, string>[] = [
  {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "9876543210",
    department: "Engineering",
    designation: "Software Developer",
    dateOfJoining: "2024-01-15",
    dateOfBirth: "1995-06-10",
    status: "active",
    address: "123 Main Street, City",
    company: "Your Company Name",
  },
  {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phone: "9876543211",
    department: "Marketing",
    designation: "Marketing Manager",
    dateOfJoining: "2024-03-01",
    dateOfBirth: "",
    status: "active",
    address: "456 Oak Avenue, City",
    company: "Your Company Name",
  },
]

export function downloadSampleExcel() {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_ROWS, { header: SAMPLE_HEADERS })

  const colWidths = SAMPLE_HEADERS.map((h) => ({
    wch: Math.max(h.length, 20),
  }))
  ws["!cols"] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Employees")

  XLSX.writeFile(wb, "sample-employees.xlsx")
}

export function parseEmployeeExcel(file: File): Promise<Partial<EmployeeFormData>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: "array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws)

        const employees: Partial<EmployeeFormData>[] = rows.map((row) => ({
          firstName: row.firstName || "",
          lastName: row.lastName || "",
          email: row.email || "",
          phone: row.phone || "",
          department: row.department || "",
          designation: row.designation || "",
          dateOfJoining: formatExcelDate(row.dateOfJoining),
          dateOfBirth: row.dateOfBirth ? formatExcelDate(row.dateOfBirth) : "",
          lastWorkingDate: row.lastWorkingDate ? formatExcelDate(row.lastWorkingDate) : "",
          status: (row.status || "active") as EmployeeStatus,
          address: row.address || "",
          companyId: row.company || row.companyId || "",
        }))

        resolve(employees)
      } catch (err) {
        reject(new Error("Failed to parse Excel file"))
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsArrayBuffer(file)
  })
}

function formatExcelDate(value: unknown): string {
  if (!value) return ""
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value)
    if (date) {
      const y = date.y
      const m = String(date.m).padStart(2, "0")
      const d = String(date.d).padStart(2, "0")
      return `${y}-${m}-${d}`
    }
  }
  return String(value)
}

export async function importEmployees(
  employees: Partial<EmployeeFormData>[],
  onProgress?: (done: number, total: number) => void
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (let i = 0; i < employees.length; i++) {
    try {
      const emp = employees[i]
      if (!emp.firstName || !emp.lastName || !emp.email || !emp.department || !emp.designation || !emp.dateOfJoining || !emp.address || !emp.companyId) {
        failed++
        errors.push(`Row ${i + 2}: Missing required fields`)
        continue
      }
      await addEmployee(emp as EmployeeFormData)
      success++
    } catch {
      failed++
      errors.push(`Row ${i + 2}: Failed to create employee`)
    }
    onProgress?.(i + 1, employees.length)
  }

  return { success, failed, errors }
}

export function exportEmployeesToExcel(
  employees: { firstName: string; lastName: string; email: string; phone: string; department: string; designation: string; dateOfJoining: string; dateOfBirth: string; lastWorkingDate: string; status: string; address: string; company: string }[]
) {
  const rows = employees.map((e) => ({
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    phone: e.phone,
    department: e.department,
    designation: e.designation,
    dateOfJoining: e.dateOfJoining,
    dateOfBirth: e.dateOfBirth,
    lastWorkingDate: e.lastWorkingDate,
    status: e.status,
    address: e.address,
    company: e.company,
  }))

  const ws = XLSX.utils.json_to_sheet(rows, { header: SAMPLE_HEADERS })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Employees")
  XLSX.writeFile(wb, "employees.xlsx")
}
