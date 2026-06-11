"use client"

import { useEffect, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FileText, Loader2, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import type { Employee, DocumentTemplate, DocumentType, SalaryStructure, CompanySettings } from "@/lib/types"
import { DOCUMENT_TYPE_LABELS } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"

const generateSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  templateId: z.string().min(1, "Select a template"),
})

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
      getTemplate(templateId).then(setSelectedTemplate)
    }
  }, [templateId])

  const replaceVariables = useCallback(
    (content: string) => {
      if (!selectedEmployee || !settings) return content

      const emp = selectedEmployee
      const sals = salary
      const s = settings
      const today = format(new Date(), "PPP")

      const map: Record<string, string> = {
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
        grossSalary: sals ? `Rs. ${sals.grossSalary.toLocaleString()}` : "N/A",
        netSalary: sals ? `Rs. ${sals.netSalary.toLocaleString()}` : "N/A",
        otherAllowances: sals
          ? sals.otherAllowances.map((a) => `${a.label}: Rs. ${a.amount.toLocaleString()}`).join("\n")
          : "N/A",
        deductions: sals
          ? sals.deductions.map((d) => `${d.label}: Rs. ${d.amount.toLocaleString()}`).join("\n")
          : "N/A",
        payPeriod: format(new Date(), "MMMM yyyy"),
        effectiveDate: sals ? format(sals.effectiveFrom.toDate(), "PPP") : today,
        relievingDate: today,
      }

      let result = content
      for (const [key, value] of Object.entries(map)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value)
      }
      return result
    },
    [selectedEmployee, salary, settings]
  )

  useEffect(() => {
    if (selectedTemplate && selectedEmployee) {
      setPreviewContent(replaceVariables(selectedTemplate.content))
    }
  }, [selectedTemplate, selectedEmployee, replaceVariables])

  const onSubmit = async () => {
    if (!selectedTemplate || !selectedEmployee) return
    setGenerating(true)
    setGeneratedUrl("")

    try {
      const payload = {
        content: previewContent,
        type: selectedTemplate.type,
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
        type: selectedTemplate.type,
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
        <Card>
          <CardHeader>
            <CardTitle>Select Options</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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
                <Label>Document Type</Label>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Select onValueChange={(v: any) => setValue("templateId", v || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {DOCUMENT_TYPE_LABELS[t.type as DocumentType] || t.name}
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
                    <span>₹{salary.grossSalary.toLocaleString()}</span>
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

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {previewContent ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg max-h-[500px] overflow-y-auto">
                {previewContent}
              </pre>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an employee and document type to see preview</p>
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
            <Button
              render={<a href={generatedUrl} target="_blank" rel="noopener noreferrer" />}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
