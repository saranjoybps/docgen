"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FileText, Loader2, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getEmployees } from "@/services/employees"
import { getTemplates, getTemplate } from "@/services/templates"
import { getActiveSalary } from "@/services/salary"
import { getCompanySettings } from "@/services/settings"
import { saveGeneratedDocument } from "@/services/documents"
import type { Employee, DocumentTemplate, SalaryStructure, CompanySettings } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"

const generateSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  templateId: z.string().min(1, "Select a template"),
})

const AUTO_VARIABLES = new Set([
  "date", "employeeName", "employeeAddress", "designation", "department",
  "companyName", "companyAddress", "companyPhone", "companyEmail",
  "dateOfJoining", "basicPay", "hra", "da", "grossSalary", "grossEarnings",
  "netSalary", "otherAllowances", "otherDeductions", "payPeriod",
  "effectiveDate", "relievingDate",
])

export default function GenerateDocumentsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [salary, setSalary] = useState<SalaryStructure | null>(null)
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [previewContent, setPreviewContent] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState("")
  const [customValues, setCustomValues] = useState<Record<string, string>>({})

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(generateSchema),
    defaultValues: { employeeId: "", templateId: "" },
  })

  const employeeId = watch("employeeId")
  const templateId = watch("templateId")

  useEffect(() => {
    async function load() {
      const [emps, tmpls, stgs] = await Promise.all([
        getEmployees(),
        getTemplates(),
        getCompanySettings(),
      ])
      setEmployees(emps.filter((e) => e.status === "active"))
      setTemplates(tmpls)
      setSettings(stgs)
    }
    load()
  }, [])

  useEffect(() => {
    if (employeeId) {
      const emp = employees.find((e) => e.id === employeeId)
      setSelectedEmployee(emp || null)
      getActiveSalary(employeeId).then(setSalary)
    }
  }, [employeeId, employees])

  useEffect(() => {
    if (templateId) {
      getTemplate(templateId).then((t) => {
        setSelectedTemplate(t)
        setCustomValues({})
        setGeneratedUrl("")
      })
    }
  }, [templateId])

  const customVariables = useMemo(() => {
    if (!selectedTemplate) return []
    return selectedTemplate.variables.filter((v) => !AUTO_VARIABLES.has(v))
  }, [selectedTemplate])

  const buildVariableMap = useCallback(() => {
    if (!selectedEmployee || !settings) return {}

    const emp = selectedEmployee
    const sals = salary
    const s = settings
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
      relievingDate: today,
    }
  }, [selectedEmployee, salary, settings])

  const replaceVariables = useCallback(
    (content: string) => {
      const autoMap = buildVariableMap()
      const merged = { ...autoMap, ...customValues }
      let result = content
      for (const [key, value] of Object.entries(merged)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value || `{${key}}`)
      }
      return result
    },
    [buildVariableMap, customValues]
  )

  useEffect(() => {
    if (selectedTemplate && selectedEmployee) {
      setPreviewContent(replaceVariables(selectedTemplate.content))
    }
  }, [selectedTemplate, selectedEmployee, replaceVariables])

  const updateCustomValue = (key: string, value: string) => {
    setCustomValues((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = async () => {
    if (!selectedTemplate || !selectedEmployee) return
    setGenerating(true)
    setGeneratedUrl("")

    try {
      const payload = {
        content: previewContent,
        type: selectedTemplate.name,
        employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
        templateName: selectedTemplate.name,
      }

      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to generate PDF")

      const result = await res.json()

      await saveGeneratedDocument({
        employeeId: selectedEmployee.id,
        templateId: selectedTemplate.id,
        type: selectedTemplate.name,
        pdfUrl: result.url,
        cloudinaryPublicId: result.publicId,
        metadata: {
          employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
          templateName: selectedTemplate.name,
        },
      })

      setGeneratedUrl(result.url)
      toast.success("Document generated successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate document")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Document</h1>
        <p className="text-zinc-500 mt-1">Generate documents for employees</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Options</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select onValueChange={(v: any) => setValue("employeeId", v || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
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
                  <Select onValueChange={(v: any) => setValue("templateId", v || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
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

                <div className="flex gap-3">
                  {selectedTemplate && selectedEmployee && (
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button variant="outline" className="flex-1" />
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {selectedTemplate.name} - {selectedEmployee.firstName} {selectedEmployee.lastName}
                          </DialogTitle>
                        </DialogHeader>
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {previewContent}
                        </pre>
                      </DialogContent>
                    </Dialog>
                  )}

                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={generating || !selectedTemplate || !selectedEmployee}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate & Upload
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {customVariables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Custom Values</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {previewContent ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg max-h-[600px] overflow-y-auto">
                {previewContent}
              </pre>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an employee and template to see preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {generatedUrl && (
        <Card>
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-green-600">Document generated successfully!</p>
              <p className="text-sm text-zinc-500">The PDF has been uploaded to Cloudinary.</p>
            </div>
            <a
              href={`/api/download-document?url=${encodeURIComponent(generatedUrl)}&name=${encodeURIComponent((selectedTemplate?.name || "document") + ".pdf")}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
