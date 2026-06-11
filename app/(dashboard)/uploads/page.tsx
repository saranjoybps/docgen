"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getEmployees } from "@/services/employees"
import { getUploadedDocuments, saveUploadedDocument } from "@/services/documents"
import type { Employee, UploadedDocument, DocumentType } from "@/lib/types"
import { DOCUMENT_TYPE_LABELS } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"
import { Upload, ExternalLink } from "lucide-react"
import { CldUploadWidget } from "next-cloudinary"

const UPLOAD_TYPES = [
  { value: "experience_letter", label: "Experience Letter" },
  { value: "relieving_letter", label: "Relieving Letter" },
  { value: "payslip", label: "Payslip" },
  { value: "other", label: "Other" },
]

export default function UploadsPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [uploads, setUploads] = useState<UploadedDocument[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [emps, uplds] = await Promise.all([
        getEmployees(),
        getUploadedDocuments(),
      ])
      setEmployees(emps)
      setUploads(uplds)
    } catch {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    loadData().then(() => {})
    return () => { mounted = false }
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUploadSuccess = async (result: any) => {
    if (!selectedEmployee || !selectedType) {
      toast.error("Please select an employee and document type")
      return
    }

    try {
      await saveUploadedDocument({
        employeeId: selectedEmployee,
        type: selectedType as DocumentType | "other",
        originalFileName: result.info.original_filename + "." + result.info.format,
        cloudinaryUrl: result.info.secure_url,
        cloudinaryPublicId: result.info.public_id,
        uploadedBy: user?.uid || "",
      })

      toast.success("Document uploaded successfully")
      const uplds = await getUploadedDocuments()
      setUploads(uplds)
    } catch {
      toast.error("Failed to save document record")
    }
  }

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id)
    return emp ? `${emp.firstName} ${emp.lastName}` : "Unknown"
  }

  const getTypeLabel = (type: string) => {
    return DOCUMENT_TYPE_LABELS[type as DocumentType] || type
  }

  if (loading) {
    return <div className="text-center py-12 text-zinc-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Documents</h1>
        <p className="text-zinc-500 mt-1">
          Upload existing documents for experienced employees
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Select value={selectedEmployee} onValueChange={(v: any) => { if (v) setSelectedEmployee(v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Document Type</Label>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Select value={selectedType} onValueChange={(v: any) => { if (v) setSelectedType(v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {UPLOAD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployee && selectedType && (
              <CldUploadWidget
                uploadPreset="documents_preset"
                onSuccess={handleUploadSuccess}
                options={{
                  maxFiles: 1,
                  resourceType: "raw",
                  folder: "employee-documents",
                }}
              >
                {({ open }) => (
                  <Button onClick={() => open()} className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                )}
              </CldUploadWidget>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                      No documents uploaded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  uploads.slice(0, 10).map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell className="font-medium">
                        {getEmployeeName(upload.employeeId)}
                      </TableCell>
                      <TableCell>{getTypeLabel(upload.type)}</TableCell>
                      <TableCell className="text-zinc-500">
                        {format(upload.uploadedAt.toDate(), "PP")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            render={<a href={upload.cloudinaryUrl} target="_blank" rel="noopener noreferrer" />}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
