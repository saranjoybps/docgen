"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { getEmployees } from "@/services/employees"
import { getUploadedDocuments, deleteUploadedDocument, saveUploadedDocument } from "@/services/documents"
import type { Employee, UploadedDocument, DocumentType } from "@/lib/types"
import { DOCUMENT_TYPE_LABELS } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"
import { Plus, Download, Trash2, FileText, Upload, X } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth/auth-provider"

const BULK_TYPE_GROUPS: { label: string; types: DocumentType[] }[] = [
  {
    label: "Identity & Address Proof",
    types: ["aadhaar_card", "pan_card", "passport", "address_proof", "bank_account_proof"],
  },
  {
    label: "Educational Documents",
    types: ["marksheet_10th", "marksheet_12th", "degree_certificate", "semester_marksheets", "professional_certifications"],
  },
  {
    label: "Employment & Experience",
    types: ["updated_resume", "previous_company_offer_letter", "appointment_letter", "experience_letter", "relieving_letter", "promotion_letter", "offer_letter", "confirmation_letter", "employment_contract"],
  },
  {
    label: "Payroll & Financial",
    types: ["payslip", "latest_increment_letter", "increment_letter", "salary_revision", "bonus_letter", "form_16", "salary_bank_statement", "uan_number", "pf_details", "esic_details"],
  },
  {
    label: "Performance & Review",
    types: ["appraisal_letter"],
  },
  {
    label: "Separation",
    types: ["resignation_letter", "separation_letter"],
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
    label: "Other Documents",
    types: ["passport_photo", "emergency_contact", "background_verification", "other"],
  },
]

function getDownloadUrl(cloudinaryUrl: string, fileName: string) {
  return `/api/download-document?url=${encodeURIComponent(cloudinaryUrl)}&name=${encodeURIComponent(fileName)}`
}

export default function UploadsPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [uploads, setUploads] = useState<UploadedDocument[]>([])
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; cloudinaryPublicId: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkEmployee, setBulkEmployee] = useState("")
  const [bulkFiles, setBulkFiles] = useState<{ file: File; type: string }[]>([])
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)
  const bulkFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      getEmployees(),
      getUploadedDocuments(),
    ])
      .then(([emps, uplds]) => {
        setEmployees(emps)
        setUploads(uplds)
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false))
  }, [])

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id)
    return emp ? `${emp.firstName} ${emp.lastName}` : "Unknown"
  }

  const handleDelete = async (id: string, cloudinaryPublicId: string) => {
    try {
      await deleteUploadedDocument(id)
      setUploads((prev) => prev.filter((u) => u.id !== id))
      toast.success("Document deleted")
    } catch {
      toast.error("Failed to delete")
      setDeleteTarget(null)
      return
    }
    try {
      await fetch(`/api/delete-cloudinary-file?publicId=${encodeURIComponent(cloudinaryPublicId)}`, {
        method: "DELETE",
      })
    } catch {
      console.warn("Failed to delete file from Cloudinary")
    }
    setDeleteTarget(null)
  }

  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newFiles = files.map((f) => ({ file: f, type: "" }))
    setBulkFiles((prev) => [...prev, ...newFiles])
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = ""
  }

  const removeBulkFile = (index: number) => {
    setBulkFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const updateBulkFileType = (index: number, type: string) => {
    setBulkFiles((prev) => prev.map((f, i) => (i === index ? { ...f, type } : f)))
  }

  const openBulkUpload = () => {
    setBulkEmployee("")
    setBulkFiles([])
    setBulkProgress(0)
    setBulkUploading(false)
    setBulkOpen(true)
  }

  const closeBulkUpload = () => {
    setBulkOpen(false)
    setBulkEmployee("")
    setBulkFiles([])
    setBulkProgress(0)
    setBulkUploading(false)
  }

  const handleBulkUpload = async () => {
    if (!bulkEmployee) {
      toast.error("Please select an employee")
      return
    }
    const validFiles = bulkFiles.filter((f) => f.type)
    if (validFiles.length === 0) {
      toast.error("Please select a document type for at least one file")
      return
    }

    setBulkUploading(true)
    setBulkProgress(0)
    let success = 0
    let failed = 0

    for (let i = 0; i < validFiles.length; i++) {
      const { file, type } = validFiles[i]
      try {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/upload-document", { method: "POST", body: formData })
        if (!res.ok) throw new Error("Upload failed")

        const result = await res.json()

        await saveUploadedDocument({
          employeeId: bulkEmployee,
          type: type as DocumentType,
          originalFileName: result.originalFileName,
          cloudinaryUrl: result.url,
          cloudinaryPublicId: result.publicId,
          uploadedBy: user?.uid || "",
        })
        success++
      } catch {
        failed++
      }
      setBulkProgress(i + 1)
    }

    if (success > 0) {
      toast.success(`${success} document${success > 1 ? "s" : ""} uploaded successfully`)
      const uplds = await getUploadedDocuments()
      setUploads(uplds)
    }
    if (failed > 0) {
      toast.error(`${failed} document${failed > 1 ? "s" : ""} failed to upload`)
    }
    setBulkUploading(false)
    if (failed === 0) closeBulkUpload()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const allTypes = Array.from(
    new Set(uploads.map((u) => u.type))
  ) as DocumentType[]

  const columns: Column<UploadedDocument>[] = [
    {
      header: "Employee",
      cell: (u) => (
        <span className="font-medium">{getEmployeeName(u.employeeId)}</span>
      ),
    },
    {
      header: "Type",
      cell: (u) => DOCUMENT_TYPE_LABELS[u.type],
    },
    {
      header: "File",
      cell: (u) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
          <span className="truncate max-w-[200px]">{u.originalFileName}</span>
        </div>
      ),
      hideable: "md",
    },
    {
      header: "Uploaded",
      cell: (u) => (
        <span className="text-zinc-500 dark:text-zinc-400">
          {format(u.uploadedAt.toDate(), "PP")}
        </span>
      ),
      hideable: "lg",
    },
    {
      header: "",
      className: "w-28",
      cell: (u) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={<a href={getDownloadUrl(u.cloudinaryUrl, u.originalFileName)} />}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={<Link href={`/uploads/${u.id}/edit`} />}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget({ id: u.id, cloudinaryPublicId: u.cloudinaryPublicId })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Uploaded Documents</h1>
          <p className="text-zinc-500 mt-1">{uploads.length} total documents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openBulkUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button nativeButton={false} render={<Link href="/uploads/add" />}>
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </div>
      </div>

      <DataTable
        data={uploads}
        columns={columns}
        keyExtractor={(u) => u.id}
        loading={loading}
        emptyMessage="No documents found"
        searchable
        searchPlaceholder="Search by employee, type, or file name..."
        searchFn={(u, q) =>
          getEmployeeName(u.employeeId).toLowerCase().includes(q) ||
          (DOCUMENT_TYPE_LABELS[u.type] ?? "").toLowerCase().includes(q) ||
          u.originalFileName.toLowerCase().includes(q)
        }
        filters={
          allTypes.length > 0
            ? [
                {
                  label: "Type",
                  options: allTypes.map((t) => ({
                    label: DOCUMENT_TYPE_LABELS[t],
                    value: t,
                  })),
                  filterFn: (u, v) => u.type === v,
                },
              ]
            : undefined
        }
      />

      {bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={closeBulkUpload} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-semibold">Bulk Upload Documents</h2>
                <p className="text-sm text-zinc-500 mt-0.5">Upload multiple documents at once</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeBulkUpload}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select value={bulkEmployee} onValueChange={(v) => { if (v) setBulkEmployee(v) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee">
                      {bulkEmployee ? getEmployeeName(bulkEmployee) : undefined}
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
                <Label>Files</Label>
                <div
                  onClick={() => bulkFileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-zinc-400 transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Click to select files</p>
                  <p className="text-xs text-zinc-400 mt-1">Multiple files can be selected</p>
                  <input
                    ref={bulkFileInputRef}
                    type="file"
                    multiple
                    onChange={handleBulkFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {bulkFiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">{bulkFiles.length} file{bulkFiles.length > 1 ? "s" : ""} selected</p>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {bulkFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 border rounded-lg p-3">
                        <FileText className="h-6 w-6 text-zinc-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{f.file.name}</p>
                          <p className="text-xs text-zinc-500">{formatFileSize(f.file.size)}</p>
                        </div>
                        <Select value={f.type} onValueChange={(v) => { if (v) updateBulkFileType(i, v) }}>
                          <SelectTrigger className="w-44">
                            <SelectValue placeholder="Document type" />
                          </SelectTrigger>
                          <SelectContent>
                            {BULK_TYPE_GROUPS.map((group) => (
                              <SelectGroup key={group.label}>
                                <SelectLabel>{group.label}</SelectLabel>
                                {group.types.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {DOCUMENT_TYPE_LABELS[t]}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => removeBulkFile(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bulkUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Uploading...</span>
                    <span className="font-medium">{bulkProgress} / {bulkFiles.filter((f) => f.type).length}</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-zinc-900 dark:bg-zinc-100 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(bulkProgress / Math.max(bulkFiles.filter((f) => f.type).length, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {bulkFiles.length > 0 && !bulkUploading && (
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={closeBulkUpload}>Cancel</Button>
                  <Button onClick={handleBulkUpload}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload All ({bulkFiles.filter((f) => f.type).length})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id, deleteTarget.cloudinaryPublicId)}
      />
    </div>
  )
}
