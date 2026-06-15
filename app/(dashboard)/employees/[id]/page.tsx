"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Pencil, Calendar, Mail, Phone, Cake, MapPin, BadgeCheck, FileText, Upload, IndianRupee, Building2, Briefcase, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getEmployee, updateEmployeeStatus } from "@/services/employees"
import { getSalaryStructures, deactivateSalary } from "@/services/salary"
import { getGeneratedDocuments, getUploadedDocuments } from "@/services/documents"
import { getCompanySettings } from "@/services/settings"
import type { Employee, SalaryStructure, GeneratedDocument, UploadedDocument, CompanySettings } from "@/lib/types"
import { format } from "date-fns"
import { toast } from "sonner"
import { DOCUMENT_TYPE_LABELS } from "@/lib/types"

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  inactive: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  terminated: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  resigned: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [salaries, setSalaries] = useState<SalaryStructure[]>([])
  const [documents, setDocuments] = useState<GeneratedDocument[]>([])
  const [uploads, setUploads] = useState<UploadedDocument[]>([])
  const [companyName, setCompanyName] = useState("")

  useEffect(() => {
    const id = params.id as string
    async function load() {
      const [emp, sals, docs, uplds] = await Promise.all([
        getEmployee(id),
        getSalaryStructures(id),
        getGeneratedDocuments(id),
        getUploadedDocuments(id),
      ])
      if (!emp) {
        toast.error("Employee not found")
        router.push("/employees")
        return
      }
      setEmployee(emp)
      setSalaries(sals)
      setDocuments(docs)
      setUploads(uplds)
      if (emp.companyId) {
        const cs = await getCompanySettings(emp.companyId)
        setCompanyName(cs?.companyName || "")
      }
    }
    load()
  }, [params.id, router])

  if (!employee) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2 text-zinc-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
          <p className="text-sm">Loading employee details...</p>
        </div>
      </div>
    )
  }

  const initials = `${employee.firstName[0]}${employee.lastName[0]}`

  const handleStatusChange = async (status: string) => {
    if (!status) return
    try {
      await updateEmployeeStatus(employee.id, status as Employee["status"])
      setEmployee({ ...employee, status: status as Employee["status"] })
      toast.success("Status updated")
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleDeactivateSalary = async (id: string) => {
    try {
      await deactivateSalary(id)
      setSalaries(salaries.map((s) => (s.id === id ? { ...s, isActive: false } : s)))
      toast.success("Salary deactivated")
    } catch {
      toast.error("Failed to deactivate salary")
    }
  }

  const salaryColumns: Column<SalaryStructure>[] = [
    {
      header: "Effective From",
      cell: (s) => (
        <div className="flex items-center gap-2">
          <span>{format(s.effectiveFrom.toDate(), "PP")}</span>
          {s.isActive && <BadgeCheck className="h-4 w-4 text-emerald-600" />}
        </div>
      ),
    },
    { header: "Basic", cell: (s) => `₹${s.basicPay.toLocaleString()}` },
    { header: "HRA", cell: (s) => `₹${s.hra.toLocaleString()}` },
    { header: "Gross /mo", cell: (s) => `₹${s.grossEarnings.toLocaleString()}` },
    {
      header: "Deductions /mo",
      cell: (s) => <span className="text-red-600">- ₹{s.totalDeductions.toLocaleString()}</span>,
    },
    {
      header: "Net /mo",
      cell: (s) => <span className="text-emerald-600 font-medium">₹{s.netSalary.toLocaleString()}</span>,
    },
    {
      header: "",
      className: "w-24",
      cell: (s) =>
        s.isActive ? (
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDeactivateSalary(s.id)}>
            Deactivate
          </Button>
        ) : null,
    },
  ]

  const documentColumns: Column<GeneratedDocument>[] = [
    { header: "Type", cell: (d) => d.type },
    {
      header: "Generated",
      cell: (d) => (
        <span className="text-zinc-500 dark:text-zinc-400 text-sm">
          {format(d.generatedAt.toDate(), "PPP")}
        </span>
      ),
    },
    {
      header: "",
      className: "w-24",
      cell: (d) => (
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={`/api/download-document?url=${encodeURIComponent(d.pdfUrl)}&name=${encodeURIComponent(`${d.type}.pdf`)}`} />}
        >
          Download
        </Button>
      ),
    },
  ]

  const uploadColumns: Column<UploadedDocument>[] = [
    { header: "Type", cell: (u) => DOCUMENT_TYPE_LABELS[u.type] },
    { header: "File", cell: (u) => <span className="text-sm">{u.originalFileName}</span> },
    {
      header: "Uploaded",
      cell: (u) => (
        <span className="text-zinc-500 dark:text-zinc-400 text-sm">
          {format(u.uploadedAt.toDate(), "PPP")}
        </span>
      ),
    },
    {
      header: "",
      className: "w-24",
      cell: (u) => (
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={`/api/download-document?url=${encodeURIComponent(u.cloudinaryUrl)}&name=${encodeURIComponent(u.originalFileName)}`} />}
        >
          Download
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/employees" />}>
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to Employees
      </Button>

      {/* Header */}
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-2xl font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h1>
            <Badge className={statusStyles[employee.status]}>
              {employee.status}
            </Badge>
          </div>
          <p className="text-zinc-500 mt-0.5">
            {employee.designation} &middot; {employee.department}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" nativeButton={false} render={<Link href={`/employees/${employee.id}/edit`} />}>
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <Calendar className="h-3.5 w-3.5" />
            Date of Joining
          </div>
          <p className="text-sm font-semibold">{format(employee.dateOfJoining.toDate(), "PPP")}</p>
        </div>
        <div className="border rounded-lg p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <Mail className="h-3.5 w-3.5" />
            Email
          </div>
          <p className="text-sm font-semibold truncate">{employee.email}</p>
        </div>
        <div className="border rounded-lg p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <Phone className="h-3.5 w-3.5" />
            Phone
          </div>
          <p className="text-sm font-semibold">{employee.phone}</p>
        </div>
        <div className="border rounded-lg p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <Cake className="h-3.5 w-3.5" />
            Date of Birth
          </div>
          <p className="text-sm font-semibold">
            {employee.dateOfBirth ? format(employee.dateOfBirth.toDate(), "PPP") : "—"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">
            <Building2 className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="salary">
            <IndianRupee className="h-4 w-4 mr-2" />
            Salary
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="uploads">
            <Upload className="h-4 w-4 mr-2" />
            Uploads
          </TabsTrigger>
        </TabsList>

        {/* Details tab */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employee Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Department</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Briefcase className="h-4 w-4 text-zinc-400 shrink-0" />
                    <p className="font-medium">{employee.department}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Designation</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Building2 className="h-4 w-4 text-zinc-400 shrink-0" />
                    <p className="font-medium">{employee.designation}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                    <p className="font-medium">{employee.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Phone</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                    <p className="font-medium">{employee.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Date of Joining</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
                    <p className="font-medium">{format(employee.dateOfJoining.toDate(), "PPP")}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Date of Birth</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Cake className="h-4 w-4 text-zinc-400 shrink-0" />
                    <p className="font-medium">
                      {employee.dateOfBirth ? format(employee.dateOfBirth.toDate(), "PPP") : "—"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Last Working Date</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <LogOut className="h-4 w-4 text-zinc-400 shrink-0" />
                    <p className="font-medium">
                      {employee.lastWorkingDate ? format(employee.lastWorkingDate.toDate(), "PPP") : "—"}
                    </p>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Address</p>
                  <div className="flex items-start gap-1.5 mt-1">
                    <MapPin className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                    <p className="font-medium">{employee.address}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Company</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Building2 className="h-4 w-4 text-zinc-400 shrink-0" />
                    <p className="font-medium">{companyName || (employee.companyId ? "Loading..." : "—")}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</p>
                  <div className="mt-1">
                    <select
                      value={employee.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-400/50"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="terminated">Terminated</option>
                      <option value="resigned">Resigned</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary tab */}
        <TabsContent value="salary" className="mt-4 space-y-4">
          {salaries.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <IndianRupee className="h-8 w-8" />
                  <p className="font-medium">No salary structures defined</p>
                  <p className="text-sm">Add a salary structure for this employee to get started.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              data={salaries}
              columns={salaryColumns}
              keyExtractor={(s) => s.id}
              pageSize={5}
              pageSizeOptions={[5, 10, 20]}
            />
          )}
          <div className="flex justify-end">
            <Button nativeButton={false} render={<Link href={`/salary/add?employeeId=${employee.id}`} />}>
              <IndianRupee className="h-4 w-4 mr-1.5" />
              Add Salary Structure
            </Button>
          </div>
        </TabsContent>

        {/* Documents tab */}
        <TabsContent value="documents" className="mt-4">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <FileText className="h-8 w-8" />
                  <p className="font-medium">No documents generated</p>
                  <p className="text-sm">Generate documents from the Documents section.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              data={documents}
              columns={documentColumns}
              keyExtractor={(d) => d.id}
              pageSize={5}
              pageSizeOptions={[5, 10, 20]}
            />
          )}
        </TabsContent>

        {/* Uploads tab */}
        <TabsContent value="uploads" className="mt-4">
          {uploads.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <Upload className="h-8 w-8" />
                  <p className="font-medium">No uploaded documents</p>
                  <p className="text-sm">Upload documents for this employee from the Uploads section.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              data={uploads}
              columns={uploadColumns}
              keyExtractor={(u) => u.id}
              pageSize={5}
              pageSizeOptions={[5, 10, 20]}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
