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
          nativeButton={false}
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
          nativeButton={false}
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
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="py-3">Effective From</TableHead>
                      <TableHead className="py-3">Basic</TableHead>
                      <TableHead className="py-3">HRA</TableHead>
                      <TableHead className="py-3">Gross /mo</TableHead>
                      <TableHead className="py-3">Deductions /mo</TableHead>
                      <TableHead className="py-3">Net /mo</TableHead>
                      <TableHead className="py-3"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaries.map((salary) => (
                      <TableRow key={salary.id}>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            {format(salary.effectiveFrom.toDate(), "PP")}
                            {salary.isActive && <BadgeCheck className="h-4 w-4 text-green-600" />}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">₹{salary.basicPay.toLocaleString()}</TableCell>
                        <TableCell className="py-3">₹{salary.hra.toLocaleString()}</TableCell>
                        <TableCell className="py-3">₹{salary.grossEarnings.toLocaleString()}</TableCell>
                        <TableCell className="py-3 text-red-600">₹{salary.totalDeductions.toLocaleString()}</TableCell>
                        <TableCell className="py-3 text-green-600 font-medium">₹{salary.netSalary.toLocaleString()}</TableCell>
                        <TableCell className="py-3">
                          {salary.isActive && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeactivateSalary(salary.id)}>
                              Deactivate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          <Button nativeButton={false} render={<Link href={`/salary?employeeId=${employee.id}`} />}>
            Add Salary Structure
          </Button>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="py-3">Type</TableHead>
                    <TableHead className="py-3">Generated</TableHead>
                    <TableHead className="py-3"></TableHead>
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
                        <TableCell>{doc.type}</TableCell>
                        <TableCell className="text-zinc-500">
                          {format(doc.generatedAt.toDate(), "PPP")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<a href={`/api/download-document?url=${encodeURIComponent(doc.pdfUrl)}&name=${encodeURIComponent(`${doc.type}.pdf`)}`} />}
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
                  <TableRow className="bg-muted/50">
                    <TableHead className="py-3">Type</TableHead>
                    <TableHead className="py-3">File</TableHead>
                    <TableHead className="py-3">Uploaded</TableHead>
                    <TableHead className="py-3"></TableHead>
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
                        <TableCell>{DOCUMENT_TYPE_LABELS[upload.type]}</TableCell>
                        <TableCell className="text-zinc-500">{upload.originalFileName}</TableCell>
                        <TableCell className="text-zinc-500">
                          {format(upload.uploadedAt.toDate(), "PPP")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<a href={`/api/download-document?url=${encodeURIComponent(upload.cloudinaryUrl)}&name=${encodeURIComponent(upload.originalFileName)}`} />}
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
      </Tabs>
    </div>
  )
}
