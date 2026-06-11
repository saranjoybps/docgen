"use client"

import { useEffect, useState } from "react"
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
import { CldUploadWidget } from "next-cloudinary"
import { Upload, Building2 } from "lucide-react"
import Image from "next/image"

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
  const [loading, setLoading] = useState(true)

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
      setLoading(false)
    }
    load()
  }, [reset])

  const onSubmit = async (data: SettingsFormData) => {
    try {
      await updateCompanySettings({
        ...data,
        logoUrl,
        logoPublicId,
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-zinc-500 mt-1">Configure your company details for document generation</p>
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
                <CldUploadWidget
                  uploadPreset="documents_preset"
                   {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                   onSuccess={(result: any) => {
                    setLogoUrl(result.info.secure_url)
                    setLogoPublicId(result.info.public_id)
                    toast.success("Logo uploaded")
                  }}
                  options={{
                    maxFiles: 1,
                    folder: "company-logo",
                  }}
                >
                  {({ open }) => (
                    <Button type="button" variant="outline" onClick={() => open()}>
                      <Upload className="h-4 w-4 mr-2" />
                      {logoUrl ? "Change Logo" : "Upload Logo"}
                    </Button>
                  )}
                </CldUploadWidget>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" {...register("companyName")} />
              {errors.companyName && (
                <p className="text-sm text-red-500">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={3} {...register("address")} />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" {...register("website")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerText">Document Footer Text</Label>
              <Input id="footerText" {...register("footerText")} placeholder="This is a computer-generated document." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  )
}
