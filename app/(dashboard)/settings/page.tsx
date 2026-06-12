"use client"

import { useEffect, useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { getCompanySettings, updateCompanySettings } from "@/services/settings"
import { Upload, Building2, Pen, Loader2, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const settingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email"),
  website: z.string().optional(),
  footerText: z.string().optional(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const [logoUrl, setLogoUrl] = useState("")
  const [logoPublicId, setLogoPublicId] = useState("")
  const [signatureUrl, setSignatureUrl] = useState("")
  const [signaturePublicId, setSignaturePublicId] = useState("")
  const [uploading, setUploading] = useState(false)
  const [signatureUploading, setSignatureUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  })

  useEffect(() => {
    async function load() {
      const settings = await getCompanySettings()
      reset({
        companyName: settings.companyName,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        footerText: settings.footerText,
      })
      setLogoUrl(settings.logoUrl)
      setLogoPublicId(settings.logoPublicId)
      setSignatureUrl(settings.signatureUrl)
      setSignaturePublicId(settings.signaturePublicId)
      setLoading(false)
    }
    load()
  }, [reset])

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
    try {
      await updateCompanySettings({
        ...data,
        logoUrl,
        logoPublicId,
        signatureUrl,
        signaturePublicId,
      })
      toast.success("Settings updated")
    } catch {
      toast.error("Failed to update settings")
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-zinc-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
          <p className="text-zinc-500 mt-1">Configure your company details for document generation</p>
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

        <div className="flex gap-3 justify-end">
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  )
}
