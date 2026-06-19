"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"

import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { toast } from "sonner"
import {
  listCompanySettings,
  getCompanySettings,
  addCompanySettings,
  updateCompanySettings,
  deleteCompanySettings,
} from "@/services/settings"
import {
  Upload,
  Building2,
  Pen,
  Loader2,
  ArrowLeft,
  Palette,
  Eye,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { generateDocumentPdfBlob } from "@/lib/pdf-document"
import type { CompanySettings } from "@/lib/types"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

const settingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email"),
  website: z.string().optional(),
  registrationNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  footerText: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  bodyColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  mutedColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  watermarkEnabled: z.boolean(),
  showPageNumbers: z.boolean(),
  marginTop: z.coerce.number().min(40).max(200),
  marginBottom: z.coerce.number().min(20).max(120),
  marginLeft: z.coerce.number().min(20).max(80),
  marginRight: z.coerce.number().min(20).max(80),
  bodyFontSize: z.coerce.number().min(8).max(14),
  titleFontSize: z.coerce.number().min(12).max(24),
  watermarkOpacity: z.coerce.number().min(0).max(0.2),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const [companies, setCompanies] = useState<(CompanySettings & { id: string })[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [view, setView] = useState<"list" | "detail">("list")
  const [logoUrl, setLogoUrl] = useState("")
  const [logoPublicId, setLogoPublicId] = useState("")
  const [signatureUrl, setSignatureUrl] = useState("")
  const [signaturePublicId, setSignaturePublicId] = useState("")
  const [uploading, setUploading] = useState(false)
  const [signatureUploading, setSignatureUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [designPreviewOpen, setDesignPreviewOpen] = useState(false)
  const [designPreviewUrl, setDesignPreviewUrl] = useState<string | null>(null)
  const [designPreviewLoading, setDesignPreviewLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    defaultValues: {
      companyName: "Your Company Name",
      address: "",
      phone: "",
      email: "",
      website: "",
      registrationNumber: "",
      gstNumber: "",
      footerText: "",
      primaryColor: "#1e3a5f",
      secondaryColor: "#2563eb",
      bodyColor: "#1e293b",
      mutedColor: "#64748b",
      watermarkEnabled: true,
      showPageNumbers: true,
      marginTop: 120,
      marginBottom: 60,
      marginLeft: 40,
      marginRight: 40,
      bodyFontSize: 10,
      titleFontSize: 16,
      watermarkOpacity: 0.04,
    },
    resolver: (async (values: any) => {
      const parsed = settingsSchema.safeParse(values)
      if (parsed.success) return { values: parsed.data, errors: {} }
      const fieldErrors: Record<string, { message: string }> = {}
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = { message: issue.message }
      }
      return { values: {} as Record<string, never>, errors: fieldErrors }
    }) as any,
  })

  const watermarkEnabled = watch("watermarkEnabled")
  const showPageNumbers = watch("showPageNumbers")

  const loadCompanies = useCallback(async () => {
    const list = await listCompanySettings()
    setCompanies(list)
  }, [])

  const loadSelectedCompany = useCallback(async () => {
    if (!selectedCompanyId) return
    const settings = await getCompanySettings(selectedCompanyId)
    if (!settings) return
    reset({
      companyName: settings.companyName,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      registrationNumber: settings.registrationNumber || "",
      gstNumber: settings.gstNumber || "",
      footerText: settings.footerText,
      primaryColor: settings.primaryColor || "#1e3a5f",
      secondaryColor: settings.secondaryColor || "#2563eb",
      bodyColor: settings.bodyColor || "#1e293b",
      mutedColor: settings.mutedColor || "#64748b",
      watermarkEnabled: settings.watermarkEnabled ?? true,
      showPageNumbers: settings.showPageNumbers ?? true,
      marginTop: settings.marginTop ?? 120,
      marginBottom: settings.marginBottom ?? 60,
      marginLeft: settings.marginLeft ?? 40,
      marginRight: settings.marginRight ?? 40,
      bodyFontSize: settings.bodyFontSize ?? 10,
      titleFontSize: settings.titleFontSize ?? 16,
      watermarkOpacity: settings.watermarkOpacity ?? 0.04,
    })
    setLogoUrl(settings.logoUrl)
    setLogoPublicId(settings.logoPublicId)
    setSignatureUrl(settings.signatureUrl)
    setSignaturePublicId(settings.signaturePublicId)
  }, [selectedCompanyId, reset])

  useEffect(() => {
    loadCompanies().finally(() => setLoading(false))
  }, [loadCompanies])

  useEffect(() => {
    if (selectedCompanyId) {
      loadSelectedCompany()
    }
  }, [selectedCompanyId, loadSelectedCompany])

  const openCompany = (id: string) => {
    setSelectedCompanyId(id)
    setView("detail")
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload-logo", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error("Upload failed")
      }

      const data = await res.json()
      setLogoUrl(data.url)
      setLogoPublicId(data.publicId)
      toast.success("Logo uploaded")
    } catch {
      toast.error("Failed to upload logo")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSignatureUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload-signature", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error("Upload failed")
      }

      const data = await res.json()
      setSignatureUrl(data.url)
      setSignaturePublicId(data.publicId)
      toast.success("Signature uploaded")
    } catch {
      toast.error("Failed to upload signature")
    } finally {
      setSignatureUploading(false)
      if (signatureInputRef.current) {
        signatureInputRef.current.value = ""
      }
    }
  }

  const onSubmit = async (data: SettingsFormData) => {
    if (!selectedCompanyId) {
      toast.error("No company selected")
      return
    }
    try {
      await updateCompanySettings(selectedCompanyId, {
        companyName: data.companyName,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        registrationNumber: data.registrationNumber || "",
        gstNumber: data.gstNumber || "",
        footerText: data.footerText,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        bodyColor: data.bodyColor,
        mutedColor: data.mutedColor,
        watermarkEnabled: data.watermarkEnabled,
        showPageNumbers: data.showPageNumbers,
        marginTop: data.marginTop,
        marginBottom: data.marginBottom,
        marginLeft: data.marginLeft,
        marginRight: data.marginRight,
        bodyFontSize: data.bodyFontSize,
        titleFontSize: data.titleFontSize,
        watermarkOpacity: data.watermarkOpacity,
        logoUrl,
        logoPublicId,
        signatureUrl,
        signaturePublicId,
      })
      toast.success("Settings updated")

      const updated = await listCompanySettings()
      setCompanies(updated)
    } catch (err) {
      console.error("Failed to update settings:", err)
      const message = err instanceof Error ? err.message : "Unknown error"
      toast.error(`Failed to update settings: ${message}`)
    }
  }

  const handleAddCompany = async () => {
    try {
      const newId = await addCompanySettings({ companyName: "New Company" })
      toast.success("Company added")
      const list = await listCompanySettings()
      setCompanies(list)
      setSelectedCompanyId(newId)
      setView("detail")
    } catch (err) {
      console.error("Failed to add company:", err)
      toast.error("Failed to add company")
    }
  }

  const handleDeleteCompany = async (id: string) => {
    try {
      await deleteCompanySettings(id)
      toast.success("Company deleted")
      const list = await listCompanySettings()
      setCompanies(list)
      if (selectedCompanyId === id) {
        setSelectedCompanyId(list.length > 0 ? list[0].id : null)
        if (list.length === 0) setView("list")
      }
    } catch (err) {
      console.error("Failed to delete company:", err)
      toast.error("Failed to delete company")
    }
    setDeleteTarget(null)
  }

  const generateDesignPreview = async () => {
    setDesignPreviewLoading(true)
    setDesignPreviewUrl(null)
    setDesignPreviewOpen(true)
    try {
      const values = getValues()
      const sampleContent = [
        "DOCUMENT DESIGN PREVIEW",
        "",
        "Dear Sample Employee,",
        "",
        "This is a sample document to preview your design settings.",
        "",
        "| Component | Value |",
        "|-----------|-------|",
        "| Font Size | Body uses your configured size |",
        "| Colors | Primary, secondary, body, and muted |",
        "| Margins | Top/Bottom/Left/Right as configured |",
        "",
        "This demonstrates how your document will look with the current design settings.",
        "",
        "Sincerely,",
        "HR Team",
      ].join("\n")

      const settings = {
        companyName: values.companyName || "Your Company",
        address: values.address || "",
        phone: values.phone || "",
        email: values.email || "",
        website: values.website || "",
        registrationNumber: values.registrationNumber || "",
        gstNumber: values.gstNumber || "",
        logoUrl,
        logoPublicId,
        signatureUrl,
        signaturePublicId,
        footerText: values.footerText || "",
        primaryColor: values.primaryColor,
        secondaryColor: values.secondaryColor,
        bodyColor: values.bodyColor,
        mutedColor: values.mutedColor,
        watermarkEnabled: values.watermarkEnabled,
        showPageNumbers: values.showPageNumbers,
        marginTop: values.marginTop,
        marginBottom: values.marginBottom,
        marginLeft: values.marginLeft,
        marginRight: values.marginRight,
        bodyFontSize: values.bodyFontSize,
        titleFontSize: values.titleFontSize,
        watermarkOpacity: values.watermarkOpacity,
      }

      const blob = await generateDocumentPdfBlob(sampleContent, "Document Design Preview", "Sample Employee", settings)
      const url = URL.createObjectURL(blob)
      setDesignPreviewUrl(url)
    } catch (err) {
      console.error("Preview failed:", err)
      toast.error("Failed to generate design preview")
    } finally {
      setDesignPreviewLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-zinc-500">Loading...</div>
  }

  const columns: Column<CompanySettings & { id: string }>[] = [
    {
      header: "Company",
      cell: (c) => (
        <button onClick={() => openCompany(c.id)} className="font-medium hover:underline text-left">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-zinc-400 shrink-0" />
            {c.companyName}
          </div>
        </button>
      ),
    },
    {
      header: "Email",
      cell: (c) => <span className="text-zinc-500 dark:text-zinc-400">{c.email}</span>,
      hideable: "md",
    },
    {
      header: "Phone",
      cell: (c) => <span className="text-zinc-500 dark:text-zinc-400">{c.phone}</span>,
      hideable: "lg",
    },
    {
      header: "Website",
      cell: (c) => <span className="text-zinc-500 dark:text-zinc-400">{c.website || "—"}</span>,
      hideable: "lg",
    },
    {
      header: "",
      className: "w-28",
      cell: (c) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openCompany(c.id)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(c.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (view === "detail" && selectedCompanyId) {
    const selectedCompany = companies.find((c) => c.id === selectedCompanyId)
    if (!selectedCompany) {
      setView("list")
      return null
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView("list")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{selectedCompany.companyName}</h1>
            <p className="text-zinc-500 mt-1">Manage company settings and document design</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
                      <Image
                        src={logoUrl}
                        alt="Company logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-zinc-400" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploading ? "Uploading..." : logoUrl ? "Change Logo" : "Upload Logo"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Authorized Signature</Label>
                <div className="flex items-center gap-4">
                  {signatureUrl ? (
                    <div className="relative h-20 w-32 rounded-lg overflow-hidden border">
                      <Image
                        src={signatureUrl}
                        alt="Authorized signature"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-20 w-32 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Pen className="h-8 w-8 text-zinc-400" />
                    </div>
                  )}
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={signatureUploading}
                    onClick={() => signatureInputRef.current?.click()}
                  >
                    {signatureUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {signatureUploading ? "Uploading..." : signatureUrl ? "Change Signature" : "Upload Signature"}
                  </Button>
                  {signatureUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSignatureUrl(""); setSignaturePublicId("") }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" {...register("companyName")} />
                  {errors.companyName && (
                    <p className="text-sm text-red-500">{errors.companyName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...register("phone")} />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" {...register("website")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input id="registrationNumber" {...register("registrationNumber")} placeholder="e.g. CIN, ROC, or company registration" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input id="gstNumber" {...register("gstNumber")} placeholder="e.g. 22AAAAA0000A1Z5" />
                </div>
                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <Label htmlFor="footerText">Document Footer Text</Label>
                  <Input id="footerText" {...register("footerText")} placeholder="This is a computer-generated document." />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" rows={3} {...register("address")} />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle><Palette className="h-4 w-4 mr-2 inline" />Document Design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-md border shrink-0"
                      style={{ backgroundColor: watch("primaryColor") || "#1e3a5f" }}
                    />
                    <Input id="primaryColor" {...register("primaryColor")} placeholder="#1e3a5f" className="font-mono" />
                  </div>
                  {errors.primaryColor && <p className="text-sm text-red-500">{errors.primaryColor.message}</p>}
                  <p className="text-xs text-zinc-500">Headers, titles, and accents</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-md border shrink-0"
                      style={{ backgroundColor: watch("secondaryColor") || "#2563eb" }}
                    />
                    <Input id="secondaryColor" {...register("secondaryColor")} placeholder="#2563eb" className="font-mono" />
                  </div>
                  {errors.secondaryColor && <p className="text-sm text-red-500">{errors.secondaryColor.message}</p>}
                  <p className="text-xs text-zinc-500">Accent elements and highlights</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bodyColor">Body Text Color</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-md border shrink-0"
                      style={{ backgroundColor: watch("bodyColor") || "#1e293b" }}
                    />
                    <Input id="bodyColor" {...register("bodyColor")} placeholder="#1e293b" className="font-mono" />
                  </div>
                  {errors.bodyColor && <p className="text-sm text-red-500">{errors.bodyColor.message}</p>}
                  <p className="text-xs text-zinc-500">Main body paragraph text</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mutedColor">Muted Color</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-md border shrink-0"
                      style={{ backgroundColor: watch("mutedColor") || "#64748b" }}
                    />
                    <Input id="mutedColor" {...register("mutedColor")} placeholder="#64748b" className="font-mono" />
                  </div>
                  {errors.mutedColor && <p className="text-sm text-red-500">{errors.mutedColor.message}</p>}
                  <p className="text-xs text-zinc-500">Footer, secondary text</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Watermark</Label>
                  <div className="flex items-center gap-3 pt-1">
                    <Switch
                      checked={watermarkEnabled}
                      onCheckedChange={(v) => setValue("watermarkEnabled", v)}
                    />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {watermarkEnabled ? "Visible" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">Faint logo on all pages</p>
                </div>

                <div className="space-y-2">
                  <Label>Page Numbers</Label>
                  <div className="flex items-center gap-3 pt-1">
                    <Switch
                      checked={showPageNumbers}
                      onCheckedChange={(v) => setValue("showPageNumbers", v)}
                    />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {showPageNumbers ? "Shown" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">&ldquo;Page X of Y&rdquo; in footer</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="watermarkOpacity">Watermark Opacity</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="watermarkOpacity"
                      type="number"
                      step="0.01"
                      min="0"
                      max="0.2"
                      {...register("watermarkOpacity")}
                      className="font-mono"
                    />
                    <span className="text-xs text-zinc-500 shrink-0">0 – 0.2</span>
                  </div>
                  {errors.watermarkOpacity && <p className="text-sm text-red-500">{errors.watermarkOpacity.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bodyFontSize">Body Font Size</Label>
                  <Input
                    id="bodyFontSize"
                    type="number"
                    min="8"
                    max="14"
                    {...register("bodyFontSize")}
                    className="font-mono"
                  />
                  {errors.bodyFontSize && <p className="text-sm text-red-500">{errors.bodyFontSize.message}</p>}
                  <p className="text-xs text-zinc-500">px (8–14)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titleFontSize">Title Font Size</Label>
                  <Input
                    id="titleFontSize"
                    type="number"
                    min="12"
                    max="24"
                    {...register("titleFontSize")}
                    className="font-mono"
                  />
                  {errors.titleFontSize && <p className="text-sm text-red-500">{errors.titleFontSize.message}</p>}
                  <p className="text-xs text-zinc-500">px (12–24)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marginTop">Top Margin</Label>
                  <Input
                    id="marginTop"
                    type="number"
                    min="40"
                    max="200"
                    {...register("marginTop")}
                    className="font-mono"
                  />
                  {errors.marginTop && <p className="text-sm text-red-500">{errors.marginTop.message}</p>}
                  <p className="text-xs text-zinc-500">pts (40–200)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marginBottom">Bottom Margin</Label>
                  <Input
                    id="marginBottom"
                    type="number"
                    min="20"
                    max="120"
                    {...register("marginBottom")}
                    className="font-mono"
                  />
                  {errors.marginBottom && <p className="text-sm text-red-500">{errors.marginBottom.message}</p>}
                  <p className="text-xs text-zinc-500">pts (20–120)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marginLeft">Left Margin</Label>
                  <Input
                    id="marginLeft"
                    type="number"
                    min="20"
                    max="80"
                    {...register("marginLeft")}
                    className="font-mono"
                  />
                  {errors.marginLeft && <p className="text-sm text-red-500">{errors.marginLeft.message}</p>}
                  <p className="text-xs text-zinc-500">pts (20–80)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marginRight">Right Margin</Label>
                  <Input
                    id="marginRight"
                    type="number"
                    min="20"
                    max="80"
                    {...register("marginRight")}
                    className="font-mono"
                  />
                  {errors.marginRight && <p className="text-sm text-red-500">{errors.marginRight.message}</p>}
                  <p className="text-xs text-zinc-500">pts (20–80)</p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateDesignPreview}
                  disabled={designPreviewLoading}
                >
                  {designPreviewLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating Preview...</>
                  ) : (
                    <><Eye className="h-4 w-4 mr-2" />Preview Design</>
                  )}
                </Button>
                <p className="text-xs text-zinc-500 mt-2">Generate a sample document to preview your design settings</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => setView("list")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>

        <Sheet open={designPreviewOpen} onOpenChange={(open) => {
          if (!open) {
            setDesignPreviewOpen(false)
            if (designPreviewUrl) {
              URL.revokeObjectURL(designPreviewUrl)
              setDesignPreviewUrl(null)
            }
          }
        }}>
          <SheetContent side="right" className="!w-[50vw] !max-w-[50vw] flex flex-col">
            <SheetHeader>
              <SheetTitle>Document Design Preview</SheetTitle>
            </SheetHeader>
            <div className="flex-1 flex flex-col min-h-0">
              {designPreviewLoading ? (
                <div className="flex-1 flex items-center justify-center gap-2 text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating preview...
                </div>
              ) : designPreviewUrl ? (
                <iframe
                  src={designPreviewUrl}
                  className="flex-1 w-full border-0 min-h-0"
                  title="Design preview"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-500">
                  Preview not available
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
          <p className="text-zinc-500 mt-1">{companies.length} total companies</p>
        </div>
        <Button onClick={handleAddCompany}>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-400">
            <Building2 className="h-12 w-12 mx-auto mb-3" />
            <p className="font-medium">No companies yet</p>
            <p className="text-sm mt-1">Click &ldquo;Add Company&rdquo; to create your first company profile.</p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={companies}
          columns={columns}
          keyExtractor={(c) => c.id}
          pageSize={10}
          pageSizeOptions={[10, 20, 50]}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete Company"
        message="Are you sure you want to delete this company? This action cannot be undone."
        onConfirm={() => deleteTarget && handleDeleteCompany(deleteTarget)}
      />
    </div>
  )
}
