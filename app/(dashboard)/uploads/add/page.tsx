"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { getEmployees } from "@/services/employees"
import { saveUploadedDocument } from "@/services/documents"
import type { Employee, DocumentType } from "@/lib/types"
import { DOCUMENT_TYPE_LABELS } from "@/lib/types"
import { toast } from "sonner"
import { ArrowLeft, Upload, FileText, X } from "lucide-react"

const UPLOAD_TYPE_GROUPS: { label: string; types: DocumentType[] }[] = [
  {
    label: "Employment Letters",
    types: ["offer_letter", "appointment_letter", "confirmation_letter", "employment_contract"],
  },
  {
    label: "Performance & Review",
    types: ["appraisal_letter", "increment_letter", "bonus_letter", "salary_revision"],
  },
  {
    label: "Separation",
    types: ["resignation_letter", "relieving_letter", "experience_letter", "separation_letter"],
  },
  {
    label: "Disciplinary",
    types: ["warning_letter", "show_cause"],
  },
  {
    label: "Administrative",
    types: ["transfer_letter", "nda_agreement", "id_card", "leave_application", "medical_certificate"],
  },
  {
    label: "Other",
    types: ["payslip", "other"],
  },
]

export default function AddUploadPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getEmployees().then(setEmployees)
  }, [])

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id)
    return emp ? `${emp.firstName} ${emp.lastName}` : "Unknown"
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const clearSelection = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedEmployee || !selectedType) {
      toast.error("Please select an employee, document type, and file")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const res = await fetch("/api/upload-document", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")

      const result = await res.json()

      await saveUploadedDocument({
        employeeId: selectedEmployee,
        type: selectedType as DocumentType,
        originalFileName: result.originalFileName,
        cloudinaryUrl: result.url,
        cloudinaryPublicId: result.publicId,
        uploadedBy: user?.uid || "",
      })

      toast.success("Document uploaded successfully")
      router.push("/uploads")
    } catch {
      toast.error("Failed to upload document")
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/uploads" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Document</h1>
          <p className="text-zinc-500 mt-1">Upload a new employee document</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={selectedEmployee} onValueChange={(v) => { if (v) setSelectedEmployee(v) }}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee">
                  {selectedEmployee ? getEmployeeName(selectedEmployee) : undefined}
                </SelectValue>
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
            <Select value={selectedType} onValueChange={(v) => { if (v) setSelectedType(v) }}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type">
                  {selectedType ? DOCUMENT_TYPE_LABELS[selectedType as DocumentType] : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {UPLOAD_TYPE_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="px-2 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {group.label}
                    </div>
                    {group.types.map((t) => (
                      <SelectItem key={t} value={t}>
                        {DOCUMENT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>File</Label>
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-zinc-400 transition-colors"
              >
                <FileText className="h-10 w-10 mx-auto mb-3 text-zinc-400" />
                <p className="text-sm font-medium text-zinc-600">Click to select a file</p>
                <p className="text-xs text-zinc-400 mt-1">Any document format accepted</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-8 w-8 text-zinc-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-zinc-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearSelection}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={clearSelection}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} disabled={uploading}>
                    {uploading ? "Uploading..." : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
