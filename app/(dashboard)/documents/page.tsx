"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { FileText, Loader2, Eye, Plus, Pencil, Trash2, Edit3, RefreshCw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/ui/data-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { getEmployees } from "@/services/employees"
import { getTemplates, getTemplate, deleteTemplate } from "@/services/templates"
import { getActiveSalary } from "@/services/salary"
import { getCompanySettings } from "@/services/settings"
import { getGeneratedDocuments, saveGeneratedDocument, deleteGeneratedDocument } from "@/services/documents"
import type { Employee, DocumentTemplate, SalaryStructure, CompanySettings, GeneratedDocument } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"
import { generateDocumentPdfBlob } from "@/lib/pdf-document"
import Link from "next/link"

import type { Resolver } from "react-hook-form"

const generateSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  templateId: z.string().min(1, "Select a template"),
})

const AUTO_VARIABLES = new Set([
  "date", "employeeName", "employeeAddress", "designation", "department",
  "companyName", "companyAddress", "companyPhone", "companyEmail",
  "dateOfJoining", "basicPay", "hra", "da", "grossSalary", "grossEarnings",
  "netSalary", "otherAllowances", "otherDeductions", "payPeriod",
  "effectiveDate",
])

export default function DocumentsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [salary, setSalary] = useState<SalaryStructure | null>(null)
  const [companySettings, setCompanySettings] = useState<(CompanySettings & { id: string }) | null>(null)
  const [companySettingsLoading, setCompanySettingsLoading] = useState(false)

  const [resolvedContent, setResolvedContent] = useState("")
  const [editContent, setEditContent] = useState("")
  const [generating, setGenerating] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const previewUrlRef = useRef<string | null>(null)

  const [deleting, setDeleting] = useState<string | null>(null)
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([])
  const [generatedDocsLoading, setGeneratedDocsLoading] = useState(true)
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null)

  const {
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: (async (values: any) => {
      const parsed = generateSchema.safeParse(values)
      if (parsed.success) return { values: parsed.data, errors: {} }
      const fieldErrors: Record<string, { message: string }> = {}
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = { message: issue.message }
      }
      return { values: {} as Record<string, never>, errors: fieldErrors }
    }) as any,
    defaultValues: { employeeId: "", templateId: "" },
  })

  const employeeId = watch("employeeId")
  const templateId = watch("templateId")

  useEffect(() => {
    async function load() {
      const [emps, tmpls, docs] = await Promise.all([
        getEmployees(),
        getTemplates(),
        getGeneratedDocuments(),
      ])
      const activeEmps = emps.filter((e) => e.status === "active")
      setEmployees(activeEmps)
      setTemplates(tmpls)
      const activeIds = new Set(activeEmps.map((e) => e.id))
      setGeneratedDocs(docs.filter((d) => activeIds.has(d.employeeId)))
      setTemplatesLoading(false)
      setGeneratedDocsLoading(false)
    }
    load().catch(() => toast.error("Failed to load data"))
  }, [])

  useEffect(() => {
    if (employeeId) {
      const emp = employees.find((e) => e.id === employeeId) || null
      setSelectedEmployee(emp)
      getActiveSalary(employeeId).then(setSalary).catch(() => {})
      if (emp?.companyId) {
        setCompanySettingsLoading(true)
        getCompanySettings(emp.companyId)
          .then((cs) => {
            setCompanySettings(cs)
            setCompanySettingsLoading(false)
          })
          .catch(() => {
            toast.error("Failed to load company settings")
            setCompanySettingsLoading(false)
          })
      } else {
        setCompanySettings(null)
        setCompanySettingsLoading(false)
      }
    } else {
      setSelectedEmployee(null)
      setSalary(null)
      setCompanySettings(null)
    }
  }, [employeeId, employees])

  useEffect(() => {
    if (templateId) {
      getTemplate(templateId)
        .then((t) => {
          setSelectedTemplate(t)
          setCustomValues({})
        })
        .catch(() => toast.error("Failed to load template"))
    } else {
      setSelectedTemplate(null)
    }
  }, [templateId])

  const employeeName = useMemo(() => {
    if (!selectedEmployee) return ""
    return `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
  }, [selectedEmployee])

  const templateName = useMemo(() => {
    return selectedTemplate?.name || ""
  }, [selectedTemplate])

  const customVariables = useMemo(() => {
    if (!selectedTemplate) return []
    return selectedTemplate.variables.filter((v) => !AUTO_VARIABLES.has(v))
  }, [selectedTemplate])

  const buildVariableMap = useCallback(() => {
    if (!selectedEmployee || !companySettings) return {}
    const emp = selectedEmployee
    const sals = salary
    const s = companySettings
    const today = format(new Date(), "PPP")
    return {
      date: today,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeAddress: emp.address,
      designation: emp.designation,
      department: emp.department,
      companyName: s.companyName,
      companyAddress: s.address,
      companyPhone: s.phone,
      companyEmail: s.email,
      dateOfJoining: format(emp.dateOfJoining.toDate(), "PPP"),
      basicPay: sals ? `Rs. ${sals.basicPay.toLocaleString()}` : "N/A",
      hra: sals ? `Rs. ${sals.hra.toLocaleString()}` : "N/A",
      da: sals ? `Rs. ${sals.da.toLocaleString()}` : "N/A",
      grossSalary: sals ? `Rs. ${sals.grossEarnings.toLocaleString()}` : "N/A",
      grossEarnings: sals ? `Rs. ${sals.grossEarnings.toLocaleString()}` : "N/A",
      netSalary: sals ? `Rs. ${sals.netSalary.toLocaleString()}` : "N/A",
      otherAllowances: sals
        ? sals.otherAllowances.map((a) => `${a.label}: Rs. ${a.amount.toLocaleString()}`).join("\n")
        : "N/A",
      otherDeductions: sals
        ? sals.otherDeductions.map((d) => `${d.label}: Rs. ${d.amount.toLocaleString()}`).join("\n")
        : "N/A",
      payPeriod: format(new Date(), "MMMM yyyy"),
      effectiveDate: sals ? format(sals.effectiveFrom.toDate(), "PPP") : today,
    }
  }, [selectedEmployee, salary, companySettings])

  const replaceVariables = useCallback(
    (content: string, extraValues: Record<string, string> = {}) => {
      const autoMap = buildVariableMap()
      const merged = { ...autoMap, ...extraValues }
      let result = content
      for (const [key, value] of Object.entries(merged)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value || `{${key}}`)
      }
      return result
    },
    [buildVariableMap]
  )

  useEffect(() => {
    if (selectedTemplate && selectedEmployee) {
      const resolved = replaceVariables(selectedTemplate.content, customValues)
      setResolvedContent(resolved)
    } else {
      setResolvedContent("")
    }
  }, [selectedTemplate, selectedEmployee, replaceVariables, customValues])

  const updateCustomValue = (key: string, value: string) => {
    setCustomValues((prev) => ({ ...prev, [key]: value }))
  }

  const generatePdfPreview = useCallback(async (content: string) => {
    if (!content || !templateName) return
    setPreviewLoading(true)
    try {
      const blob = await generateDocumentPdfBlob(
        content,
        templateName,
        employeeName,
        companySettings || undefined
      )
      const url = URL.createObjectURL(blob)
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
      previewUrlRef.current = url
      setPreviewPdfUrl(url)
    } catch {
      toast.error("Failed to generate preview")
    } finally {
      setPreviewLoading(false)
    }
  }, [templateName, employeeName, companySettings])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
    }
  }, [])

  const openPreview = () => {
    if (!selectedTemplate || !selectedEmployee) {
      toast.error("Select an employee and template first")
      return
    }
    if (!selectedEmployee.companyId) {
      toast.error("Employee has no company assigned")
      return
    }
    if (!companySettings) {
      toast.error("Company settings not loaded")
      return
    }
    setEditContent(resolvedContent)
    setEditingContent(false)
    setPreviewPdfUrl(null)
    setPreviewOpen(true)
    generatePdfPreview(resolvedContent)
  }

  const refreshPreview = () => {
    generatePdfPreview(editContent)
  }

  const downloadPdf = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getContentToGenerate = () => {
    return editingContent ? editContent : resolvedContent
  }

  const generateAndUpload = async () => {
    if (!selectedTemplate || !selectedEmployee) return
    if (!selectedEmployee.companyId) {
      toast.error("Employee has no company assigned")
      return
    }
    if (!companySettings) {
      toast.error("Company settings not loaded")
      return
    }
    const content = getContentToGenerate()
    if (!content) {
      toast.error("No content to generate")
      return
    }
    setGenerating(true)
    try {
      const pdfBlob = await generateDocumentPdfBlob(
        content,
        templateName,
        employeeName,
        companySettings || undefined
      )
      const filename = `${templateName.replace(/\s+/g, "_")}_${employeeName.replace(/\s+/g, "_")}.pdf`
      downloadPdf(pdfBlob, filename)
      const formData = new FormData()
      formData.append("file", pdfBlob, filename)
      formData.append("type", templateName)
      formData.append("employeeName", employeeName)
      const res = await fetch("/api/generate-pdf", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Failed to upload PDF")
      const result = await res.json()
      await saveGeneratedDocument({
        employeeId: selectedEmployee.id,
        templateId: selectedTemplate.id,
        type: templateName,
        pdfUrl: result.url,
        cloudinaryPublicId: result.publicId,
        metadata: { employeeName, templateName },
      })
      setPreviewOpen(false)
      toast.success("Document generated and downloaded successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate document")
    } finally {
      setGenerating(false)
    }
  }

  const employeeDisplay = useMemo(() => {
    if (!employeeId) return null
    const emp = employees.find((e) => e.id === employeeId)
    return emp ? `${emp.firstName} ${emp.lastName}` : null
  }, [employeeId, employees])

  const templateDisplay = useMemo(() => {
    if (!templateId) return null
    const tmpl = templates.find((t) => t.id === templateId)
    return tmpl?.name || null
  }, [templateId, templates])

  const isReady = selectedTemplate && selectedEmployee
  const canGenerate = isReady && selectedEmployee?.companyId && !companySettingsLoading && companySettings
  const noCompany = selectedEmployee && !selectedEmployee.companyId

  const handleDeleteTemplate = async (id: string) => {
    if (deleting !== id) { setDeleting(id); return }
    try {
      await deleteTemplate(id)
      toast.success("Template deleted")
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch {
      toast.error("Failed to delete template")
    }
    setDeleting(null)
  }

  const handleDeleteGeneratedDoc = async (id: string) => {
    if (deletingDoc !== id) { setDeletingDoc(id); return }
    try {
      await deleteGeneratedDocument(id)
      toast.success("Document deleted")
      setGeneratedDocs((prev) => prev.filter((d) => d.id !== id))
    } catch {
      toast.error("Failed to delete document")
    }
    setDeletingDoc(null)
  }

  const handleDownloadDoc = async (doc: GeneratedDocument) => {
    try {
      const res = await fetch(doc.pdfUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${doc.type || "document"}_${doc.metadata?.employeeName || doc.employeeId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Failed to download document")
    }
  }

  const templateColumns: Column<DocumentTemplate>[] = [
    {
      header: "Name",
      cell: (t) => (
        <div className="flex items-center gap-2 font-medium">
          <FileText className="h-4 w-4 text-zinc-400 shrink-0" />
          {t.name}
        </div>
      ),
    },
    {
      header: "Variables",
      cell: (t) => (
        <span className="text-zinc-500 dark:text-zinc-400">{t.variables.length} variables</span>
      ),
      hideable: "md",
    },
    {
      header: "Updated",
      cell: (t) => (
        <span className="text-zinc-500 dark:text-zinc-400">{format(t.updatedAt.toDate(), "PP")}</span>
      ),
      hideable: "lg",
    },
    {
      header: "",
      className: "w-20",
      cell: (t) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/documents/templates/${t.id}/edit`} />}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant={deleting === t.id ? "destructive" : "ghost"}
            size="icon"
            onClick={() => handleDeleteTemplate(t.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-zinc-500 mt-1">Generate documents and manage templates</p>
      </div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">
            <FileText className="h-4 w-4 mr-2" />
            Generate Document
          </TabsTrigger>
          <TabsTrigger value="all">
            <FileText className="h-4 w-4 mr-2" />
            All Documents
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <Select
                      value={employeeId}
                      onValueChange={(v: string) => setValue("employeeId", v || "")}
                    >
                      <SelectTrigger className="w-full">
                        <span className="flex-1 text-left truncate">
                          {employeeDisplay || <span className="text-zinc-500 dark:text-zinc-400">Select an employee</span>}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.employeeId && (
                      <p className="text-sm text-red-500">{errors.employeeId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select
                      value={templateId}
                      onValueChange={(v: string) => setValue("templateId", v || "")}
                    >
                      <SelectTrigger className="w-full">
                        <span className="flex-1 text-left truncate">
                          {templateDisplay || <span className="text-zinc-500 dark:text-zinc-400">Select a template</span>}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.templateId && (
                      <p className="text-sm text-red-500">{errors.templateId.message}</p>
                    )}
                  </div>
                </div>

                {noCompany && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                    This employee has no company assigned. Select a company in the employee profile before generating documents.
                  </div>
                )}

                {companySettingsLoading && selectedEmployee?.companyId && (
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading company settings...
                  </div>
                )}

                {salary && (
                  <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg space-y-1 text-sm">
                    <p className="font-medium mb-2">Salary Info</p>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Gross:</span>
                      <span>₹{salary.grossEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Net:</span>
                      <span>₹{salary.netSalary.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={!canGenerate}
                    onClick={openPreview}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={generating || !canGenerate}
                    onClick={generateAndUpload}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate & Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {customVariables.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Custom Values</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customVariables.map((v) => (
                    <div key={v} className="space-y-1">
                      <Label className="text-sm capitalize">{v.replace(/([A-Z])/g, " $1").trim()}</Label>
                      <Input
                        value={customValues[v] || ""}
                        onChange={(e) => updateCustomValue(v, e.target.value)}
                        placeholder={`Enter ${v.replace(/([A-Z])/g, " $1").toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={generatedDocs}
                columns={[
                  {
                    header: "Employee",
                    cell: (doc) => (
                      <span className="font-medium">
                        {employees.find((e) => e.id === doc.employeeId)
                          ? `${employees.find((e) => e.id === doc.employeeId)!.firstName} ${employees.find((e) => e.id === doc.employeeId)!.lastName}`
                          : doc.metadata?.employeeName || doc.employeeId}
                      </span>
                    ),
                  },
                  {
                    header: "Type",
                    cell: (doc) => doc.type || doc.metadata?.templateName || "—",
                    hideable: "md",
                  },
                  {
                    header: "Generated",
                    cell: (doc) => doc.generatedAt ? format(doc.generatedAt.toDate(), "PP") : "—",
                    hideable: "lg",
                  },
                  {
                    header: "",
                    className: "w-32",
                    cell: (doc) => (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadDoc(doc)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={deletingDoc === doc.id ? "destructive" : "ghost"}
                          size="icon"
                          onClick={() => handleDeleteGeneratedDoc(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  },
                ] as Column<GeneratedDocument>[]}
                keyExtractor={(doc) => doc.id}
                loading={generatedDocsLoading}
                emptyMessage="No documents generated yet"
                searchable
                searchPlaceholder="Search documents..."
                searchFn={(doc, q) => {
                  const name = employees.find((e) => e.id === doc.employeeId)
                    ? `${employees.find((e) => e.id === doc.employeeId)!.firstName} ${employees.find((e) => e.id === doc.employeeId)!.lastName}`
                    : doc.metadata?.employeeName || ""
                  return name.toLowerCase().includes(q) || (doc.type || "").toLowerCase().includes(q)
                }}
                pageSize={10}
                pageSizeOptions={[10, 20, 50]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Document Templates</CardTitle>
              <Button size="sm" nativeButton={false} render={<Link href="/documents/templates/add" />}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add Template
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={templates}
                columns={templateColumns}
                keyExtractor={(t) => t.id}
                loading={templatesLoading}
                emptyMessage="No templates found"
                searchable
                searchPlaceholder="Search templates..."
                searchFn={(t, q) => t.name.toLowerCase().includes(q)}
                pageSize={10}
                pageSizeOptions={[10, 20, 50]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={previewOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingContent(false)
          setPreviewPdfUrl(null)
          if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current)
            previewUrlRef.current = null
          }
        }
        setPreviewOpen(open)
      }}>
        <SheetContent side="right" className="!w-[50vw] !max-w-[50vw] flex flex-col">
          <SheetHeader className="flex-row items-center justify-between gap-4">
            <SheetTitle className="truncate">
              {templateName}{templateName && employeeName ? " — " : ""}{employeeName}
            </SheetTitle>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={editingContent ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (editingContent) {
                    setEditingContent(false)
                    refreshPreview()
                  } else {
                    setEditingContent(true)
                  }
                }}
              >
                {editingContent ? (
                  <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Update Preview</>
                ) : (
                  <><Edit3 className="h-3.5 w-3.5 mr-1.5" />Edit Content</>
                )}
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 flex flex-col min-h-0">
            {editingContent ? (
              <div className="flex-1 flex flex-col gap-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 min-h-[200px] font-mono text-sm resize-none"
                  placeholder="Document content..."
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={refreshPreview}
                  disabled={previewLoading}
                  className="self-end"
                >
                  {previewLoading ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Rendering...</>
                  ) : (
                    <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Generate Preview</>
                  )}
                </Button>
              </div>
            ) : previewLoading ? (
              <div className="flex-1 flex items-center justify-center gap-2 text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating preview...
              </div>
            ) : previewPdfUrl ? (
              <iframe
                src={previewPdfUrl}
                className="flex-1 w-full border-0 min-h-0"
                title="Document preview"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                Preview not available
              </div>
            )}
          </div>

          <div className="border-t pt-4 flex gap-3">
            <Button
              className="flex-1"
              disabled={generating}
              onClick={generateAndUpload}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate & Download PDF
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
