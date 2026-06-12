"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
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
import { getUploadedDocument, updateUploadedDocument } from "@/services/documents"
import type { Employee, DocumentType, UploadedDocument } from "@/lib/types"
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

export default function EditUploadPage() {
  const params = useParams()
  const router = useRouter()
  const [upload, setUpload] = useState<UploadedDocument | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = params.id as string
    async function load() {
      const [upld, emps] = await Promise.all([
        getUploadedDocument(id),
        getEmployees(),
      ])
      if (!upld) {
        toast.error("Document not found")
        router.push("/uploads")
        return
      }
      setUpload(upld)
      setEmployees(emps)
      setSelectedEmployee(upld.employeeId)
      setSelectedType(upld.type)
    }
    load()
  }, [params.id, router])

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

  const handleSave = async () => {
    if (!selectedEmployee || !selectedType) {
      toast.error("Please select an employee and document type")
      return
    }
    if (!upload) return

    setSaving(true)
    try {
      let cloudinaryUrl = upload.cloudinaryUrl
      let cloudinaryPublicId = upload.cloudinaryPublicId
      let originalFileName = upload.originalFileName

      if (selectedFile) {
        const deleteRes = await fetch(
          `/api/delete-cloudinary-file?publicId=${encodeURIComponent(upload.cloudinaryPublicId)}`,
          { method: "DELETE" }
        )
        if (!deleteRes.ok) console.error("Failed to delete old file from Cloudinary")

        const formData = new FormData()
        formData.append("file", selectedFile)
        const uploadRes = await fetch("/api/upload-document", { method: "POST", body: formData })
        if (!uploadRes.ok) throw new Error("Upload failed")

        const result = await uploadRes.json()
        cloudinaryUrl = result.url
        cloudinaryPublicId = result.publicId
        originalFileName = result.originalFileName
      }

      await updateUploadedDocument(upload.id, {
        employeeId: selectedEmployee,
        type: selectedType as DocumentType,
        originalFileName,
        cloudinaryUrl,
        cloudinaryPublicId,
      })

      toast.success("Document updated")
      router.push("/uploads")
    } catch {
      toast.error("Failed to update document")
    } finally {
      setSaving(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  if (!upload) {
    return <div className="text-center py-12 text-zinc-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/uploads" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Document</h1>
          <p className="text-zinc-500 mt-1">{upload.originalFileName}</p>
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
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-zinc-400 transition-colors"
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <FileText className="h-6 w-6 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-600 truncate max-w-[300px]">
                    {upload.originalFileName}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">Click to replace with a new file</p>
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
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" nativeButton={false} render={<Link href="/uploads" />}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
