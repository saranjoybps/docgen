"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Pencil, User, DollarSign, FileText, Upload, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getEmployee, updateEmployeeStatus } from "@/services/employees"
import { getSalaryStructures, deactivateSalary } from "@/services/salary"
import { getGeneratedDocuments, getUploadedDocuments } from "@/services/documents"
import type { Employee, SalaryStructure, GeneratedDocument, UploadedDocument } from "@/lib/types"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DOCUMENT_TYPE_LABELS } from "@/lib/types"

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  terminated: "destructive",
  resigned: "outline",
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [salaries, setSalaries] = useState<SalaryStructure[]>([])
  const [documents, setDocuments] = useState<GeneratedDocument[]>([])
  const [uploads, setUploads] = useState<UploadedDocument[]>([])

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
    }
    load()
  }, [params.id, router])

  if (!employee) {
    return <div className="text-center py-12 text-zinc-500">Loading...</div>
  }

  const handleStatusChange = async (status: string | null) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/employees" />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {employee.firstName} {employee.lastName}
            </h1>
            <Badge variant={statusColor[employee.status]}>{employee.status}</Badge>
          </div>
          <p className="text-zinc-500 mt-1">
            {employee.designation} &middot; {employee.department}
          </p>
        </div>
        <Button
          variant="outline"
          render={<Link href={`/employees/${employee.id}/edit`} />}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Select value={employee.status} onValueChange={(value: any) => { if (value) handleStatusChange(value); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
                <SelectItem value="resigned">Resigned</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Date of Joining</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium">
            {format(employee.dateOfJoining.toDate(), "PPP")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Email</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium truncate">
            {employee.email}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info"><User className="h-4 w-4 mr-2" />Details</TabsTrigger>
          <TabsTrigger value="salary"><DollarSign className="h-4 w-4 mr-2" />Salary</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-4 w-4 mr-2" />Documents</TabsTrigger>
          <TabsTrigger value="uploads"><Upload className="h-4 w-4 mr-2" />Uploads</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="pt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-500">Phone</p>
                <p className="font-medium">{employee.phone}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Date of Birth</p>
                <p className="font-medium">
                  {employee.dateOfBirth ? format(employee.dateOfBirth.toDate(), "PPP") : "N/A"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-zinc-500">Address</p>
                <p className="font-medium">{employee.address}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="mt-4 space-y-4">
          {salaries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-zinc-500">
                No salary structures defined yet.
              </CardContent>
            </Card>
          ) : (
            salaries.map((salary) => (
              <Card key={salary.id}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">
                      {format(salary.effectiveFrom.toDate(), "PPP")}
                    </CardTitle>
                    {salary.isActive && <BadgeCheck className="h-4 w-4 text-green-600" />}
                  </div>
                  {salary.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeactivateSalary(salary.id)}
                    >
                      Deactivate
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-zinc-500">Basic Pay</p>
                      <p className="font-medium">₹{salary.basicPay.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500">HRA</p>
                      <p className="font-medium">₹{salary.hra.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500">DA</p>
                      <p className="font-medium">₹{salary.da.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500">Gross Salary</p>
                      <p className="font-medium">₹{salary.grossSalary.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500">Deductions</p>
                      <p className="font-medium">
                        ₹{salary.deductions.reduce((s, d) => s + d.amount, 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500">Net Salary</p>
                      <p className="font-medium text-green-600">₹{salary.netSalary.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <Button render={<Link href={`/salary?employeeId=${employee.id}`} />}>
            Add Salary Structure
          </Button>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-zinc-500">
                        No documents generated yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>{DOCUMENT_TYPE_LABELS[doc.type] || doc.type}</TableCell>
                        <TableCell className="text-zinc-500">
                          {format(doc.generatedAt.toDate(), "PPP")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            render={<a href={doc.pdfUrl} target="_blank" rel="noopener noreferrer" />}
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uploads" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                        No uploaded documents.
                      </TableCell>
                    </TableRow>
                  ) : (
                    uploads.map((upload) => (
                      <TableRow key={upload.id}>
                        <TableCell>{DOCUMENT_TYPE_LABELS[upload.type as keyof typeof DOCUMENT_TYPE_LABELS] || upload.type}</TableCell>
                        <TableCell className="text-zinc-500">{upload.originalFileName}</TableCell>
                        <TableCell className="text-zinc-500">
                          {format(upload.uploadedAt.toDate(), "PPP")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            render={<a href={upload.cloudinaryUrl} target="_blank" rel="noopener noreferrer" />}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
