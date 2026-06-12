"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { getEmployees } from "@/services/employees"
import { getUploadedDocuments, deleteUploadedDocument } from "@/services/documents"
import type { Employee, UploadedDocument, DocumentType } from "@/lib/types"
import { DOCUMENT_TYPE_LABELS } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"
import { Plus, Download, Trash2, FileText } from "lucide-react"

function getDownloadUrl(cloudinaryUrl: string, fileName: string) {
  return `/api/download-document?url=${encodeURIComponent(cloudinaryUrl)}&name=${encodeURIComponent(fileName)}`
}

export default function UploadsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [uploads, setUploads] = useState<UploadedDocument[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
    if (deleting !== id) {
      setDeleting(id)
      return
    }
    try {
      await fetch(`/api/delete-cloudinary-file?publicId=${encodeURIComponent(cloudinaryPublicId)}`, {
        method: "DELETE",
      })
      await deleteUploadedDocument(id)
      toast.success("Document deleted")
      setUploads((prev) => prev.filter((u) => u.id !== id))
    } catch {
      toast.error("Failed to delete")
    }
    setDeleting(null)
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
            variant={deleting === u.id ? "destructive" : "ghost"}
            size="icon"
            onClick={() => handleDelete(u.id, u.cloudinaryPublicId)}
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
        <Button nativeButton={false} render={<Link href="/uploads/add" />}>
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
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
    </div>
  )
}
