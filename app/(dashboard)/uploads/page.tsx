"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { getEmployees } from "@/services/employees"
import { getUploadedDocuments, deleteUploadedDocument } from "@/services/documents"
import type { Employee, UploadedDocument, DocumentType } from "@/lib/types"
import { DOCUMENT_TYPE_LABELS } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"
import { Plus, Download, Trash2, Search, FileText } from "lucide-react"

function getDownloadUrl(cloudinaryUrl: string, fileName: string) {
  return `/api/download-document?url=${encodeURIComponent(cloudinaryUrl)}&name=${encodeURIComponent(fileName)}`
}

export default function UploadsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [uploads, setUploads] = useState<UploadedDocument[]>([])
  const [search, setSearch] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)
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
    loadData()
  }, [loadData])

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

  const filtered = uploads.filter(
    (u) =>
      getEmployeeName(u.employeeId).toLowerCase().includes(search.toLowerCase()) ||
      DOCUMENT_TYPE_LABELS[u.type]?.toLowerCase().includes(search.toLowerCase()) ||
      u.originalFileName.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12 text-zinc-500">Loading...</div>
  }

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

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by employee, type, or file name..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="py-3.5">Employee</TableHead>
                <TableHead className="py-3.5">Type</TableHead>
                <TableHead className="py-3.5 hidden md:table-cell">File</TableHead>
                <TableHead className="py-3.5 hidden lg:table-cell">Uploaded</TableHead>
                <TableHead className="w-24 py-3.5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                    No documents found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium py-3.5">
                      {getEmployeeName(upload.employeeId)}
                    </TableCell>
                    <TableCell className="py-3.5">
                      {DOCUMENT_TYPE_LABELS[upload.type]}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate max-w-[200px]">{upload.originalFileName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground py-3.5 hidden lg:table-cell">
                      {format(upload.uploadedAt.toDate(), "PP")}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          nativeButton={false}
                          render={<a href={getDownloadUrl(upload.cloudinaryUrl, upload.originalFileName)} />}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          nativeButton={false}
                          render={<Link href={`/uploads/${upload.id}/edit`} />}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </Button>
                        <Button
                          variant={deleting === upload.id ? "destructive" : "ghost"}
                          size="icon"
                          onClick={() => handleDelete(upload.id, upload.cloudinaryPublicId)}
                        >
                          <Trash2 className="h-4 w-4" />
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
  )
}
