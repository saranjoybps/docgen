"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { getTemplate, updateTemplate } from "@/services/templates"
import type { DocumentTemplate } from "@/lib/types"
import { toast } from "sonner"

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  content: z.string().min(1, "Content is required"),
})

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const [template, setTemplate] = useState<DocumentTemplate | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: "", content: "" },
  })

  useEffect(() => {
    const id = params.id as string
    getTemplate(id).then((t) => {
      if (!t) {
        toast.error("Template not found")
        router.push("/documents/templates")
        return
      }
      setTemplate(t)
      reset({ name: t.name, content: t.content })
    })
  }, [params.id, router, reset])

  const onSubmit = async (data: { name: string; content: string }) => {
    try {
      await updateTemplate(params.id as string, data)
      toast.success("Template updated")
      router.push("/documents/templates")
    } catch {
      toast.error("Failed to update template")
    }
  }

  if (!template) {
    return <div className="text-center py-12 text-zinc-500">Loading...</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/documents/templates" />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Template</h1>
          <p className="text-zinc-500 mt-1">{template.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Available Variables</Label>
              <div className="flex flex-wrap gap-2">
                {template.variables.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800"
                  >
                    {'{'}
                    {v}
                    {'}'}
                  </span>
                ))}
              </div>
              <p className="text-xs text-zinc-500">
                Use these variables in curly braces in your template content. They will be
                replaced with actual values when generating documents.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Template Content</Label>
              <Textarea
                id="content"
                rows={20}
                className="font-mono text-sm"
                {...register("content")}
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </form>
    </div>
  )
}
