"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTemplate, updateTemplate } from "@/services/templates"
import { toast } from "sonner"
import { ArrowLeft, Save } from "lucide-react"

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = params.id as string
    getTemplate(id).then((t) => {
      if (!t) {
        toast.error("Template not found")
        router.push("/documents")
        return
      }
      setName(t.name)
      setContent(t.content)
      setLoading(false)
    })
  }, [params.id, router])

  const variables = useMemo(() => {
    const matches = content.match(/\{(\w+)\}/g)
    if (!matches) return []
    return [...new Set(matches.map((m) => m.slice(1, -1)))]
  }, [content])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !content.trim()) {
      toast.error("Name and content are required")
      return
    }

    setSaving(true)
    try {
      await updateTemplate(params.id as string, { name: name.trim(), content: content.trim() })
      toast.success("Template updated")
      router.push("/documents")
    } catch {
      toast.error("Failed to update template")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-zinc-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/documents" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Template</h1>
          <p className="text-zinc-500 mt-1">{name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Template Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            </div>

            {variables.length > 0 && (
              <div className="space-y-2">
                <Label>Detected Variables</Label>
                <div className="flex flex-wrap gap-2">
                  {variables.map((v) => (
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
                  Variables are automatically detected from {'{variableName}'} patterns in your content.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" nativeButton={false} render={<Link href="/documents" />}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </form>
    </div>
  )
}
