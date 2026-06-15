"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, ExternalLink, Upload, Download, FileDown, X, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable, type Column } from "@/components/ui/data-table"
import { getEmployees, deleteEmployee } from "@/services/employees"
import { listCompanySettings } from "@/services/settings"
import type { Employee } from "@/lib/types"
import { toast } from "sonner"
import { downloadSampleExcel, parseEmployeeExcel, importEmployees, exportEmployeesToExcel } from "@/lib/excel-utils"
import { format } from "date-fns"

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  terminated: "destructive",
  resigned: "outline",
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importTotal, setImportTotal] = useState(0)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getEmployees().then(setEmployees)
  }, [])

  const handleDelete = async (id: string) => {
    if (deleting !== id) {
      setDeleting(id)
      return
    }
    try {
      await deleteEmployee(id)
      toast.success("Employee deleted")
      setEmployees((prev) => prev.filter((e) => e.id !== id))
    } catch {
      toast.error("Failed to delete")
    }
    setDeleting(null)
  }

  const handleExport = async () => {
    try {
      const [all, companies] = await Promise.all([getEmployees(), listCompanySettings()])
      const companyMap = new Map(companies.map((c) => [c.id, c.companyName]))
      const rows = all.map((e) => ({
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        phone: e.phone,
        department: e.department,
        designation: e.designation,
        dateOfJoining: format(e.dateOfJoining.toDate(), "yyyy-MM-dd"),
        dateOfBirth: e.dateOfBirth ? format(e.dateOfBirth.toDate(), "yyyy-MM-dd") : "",
        lastWorkingDate: e.lastWorkingDate ? format(e.lastWorkingDate.toDate(), "yyyy-MM-dd") : "",
        status: e.status,
        address: e.address,
        company: companyMap.get(e.companyId) || e.companyId,
      }))
      exportEmployeesToExcel(rows)
      toast.success("Employees exported")
    } catch {
      toast.error("Failed to export employees")
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!importFile) return

    setImporting(true)
    setImportProgress(0)
    setImportResult(null)
    try {
      const parsed = await parseEmployeeExcel(importFile)

      if (parsed.length === 0) {
        toast.error("No employees found in the file")
        setImporting(false)
        return
      }

      setImportTotal(parsed.length)

      const result = await importEmployees(parsed, (done, total) => {
        setImportProgress(done)
        setImportTotal(total)
      })
      setImportResult(result)

      if (result.success > 0) {
        toast.success(`${result.success} employees imported`)
    getEmployees().then(setEmployees).catch(() => toast.error("Failed to load employees"))
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} employees failed to import`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import")
    } finally {
      setImporting(false)
      setImportFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportResult(null)
    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const columns: Column<Employee>[] = [
    {
      header: "Name",
      cell: (e) => (
        <Link href={`/employees/${e.id}`} className="font-medium hover:underline">
          {e.firstName} {e.lastName}
        </Link>
      ),
    },
    {
      header: "Email",
      cell: (e) => (
        <span className="text-zinc-500 dark:text-zinc-400">{e.email}</span>
      ),
      hideable: "md",
    },
    {
      header: "Department",
      cell: (e) => (
        <span className="text-zinc-500 dark:text-zinc-400">{e.department}</span>
      ),
    },
    {
      header: "Designation",
      cell: (e) => (
        <span className="text-zinc-500 dark:text-zinc-400">{e.designation}</span>
      ),
      hideable: "lg",
    },
    {
      header: "Status",
      cell: (e) => (
        <Badge variant={statusColor[e.status] || "outline"}>
          {e.status}
        </Badge>
      ),
    },
    {
      header: "",
      className: "w-28",
      cell: (e) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/employees/${e.id}`} />}>
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/employees/${e.id}/edit`} />}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant={deleting === e.id ? "destructive" : "ghost"}
            size="icon"
            onClick={() => handleDelete(e.id)}
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
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-zinc-500 mt-1">{employees.length} total employees</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={downloadSampleExcel}>
              <FileDown className="h-4 w-4 mr-1.5" />
              Sample
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-1.5" />
              Import
            </Button>
          </div>
          <Button nativeButton={false} render={<Link href="/employees/add" />}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {importResult && !importOpen && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Import Results: </span>
                <span className="text-emerald-600 font-medium">{importResult.success} imported</span>
                {importResult.failed > 0 && (
                  <span className="text-red-600 font-medium ml-2">{importResult.failed} failed</span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setImportResult(null)}>
                Dismiss
              </Button>
            </div>
            {importResult.errors.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto space-y-0.5">
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-500">{err}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Dialog */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={closeImport} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-semibold">Import Employees</h2>
                <p className="text-sm text-zinc-500 mt-0.5">Bulk import employees from an Excel file</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeImport}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-5 space-y-5">
              {!importFile && !importing && !importResult && (
                <>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-zinc-400 transition-colors"
                  >
                    <FileText className="h-10 w-10 mx-auto mb-3 text-zinc-400" />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Click to select Excel file</p>
                    <p className="text-xs text-zinc-400 mt-1">Supports .xlsx and .xls formats</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  <div className="text-center">
                    <button
                      onClick={downloadSampleExcel}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Download sample Excel template
                    </button>
                  </div>
                </>
              )}

              {importFile && !importing && !importResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-6 w-6 text-zinc-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{importFile.name}</p>
                        <p className="text-xs text-zinc-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setImportFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={closeImport}>Cancel</Button>
                    <Button onClick={handleImport}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Employees
                    </Button>
                  </div>
                </div>
              )}

              {importing && (
                <div className="space-y-4 py-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-400" />
                  <p className="text-sm font-medium">Importing employees...</p>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-zinc-900 dark:bg-zinc-100 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importTotal > 0 ? (importProgress / importTotal) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">{importProgress} of {importTotal}</p>
                </div>
              )}

              {importResult && !importing && (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className={`text-4xl mb-2 ${importResult.failed === 0 ? "text-emerald-500" : "text-amber-500"}`}>
                      {importResult.failed === 0 ? "✓" : "!"}
                    </div>
                    <p className="text-lg font-semibold">
                      {importResult.success} imported
                      {importResult.failed > 0 && `, ${importResult.failed} failed`}
                    </p>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1 bg-red-50 dark:bg-red-900/10 rounded-lg p-3">
                      {importResult.errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-600 dark:text-red-400">{err}</p>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button onClick={closeImport}>Done</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <DataTable
        data={employees}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchable
        searchPlaceholder="Search employees..."
        searchFn={(e, q) =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
        }
        filters={[
          {
            label: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Terminated", value: "terminated" },
              { label: "Resigned", value: "resigned" },
            ],
            filterFn: (e, v) => e.status === v,
          },
        ]}
      />
    </div>
  )
}
