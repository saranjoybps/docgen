"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTemplates, seedDefaultTemplates } from "@/services/templates"
import type { DocumentTemplate, DocumentType } from "@/lib/types"
import { DOCUMENT_TYPE_LABELS } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const result = await getTemplates()
        if (result.length === 0) {
          await seedDefaultTemplates()
          const seeded = await getTemplates()
          setTemplates(seeded)
        } else {
          setTemplates(result)
        }
      } catch (err) {
        console.error(err)
        toast.error("Failed to load templates")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="text-center py-12 text-zinc-500">Loading...</div>
  }

  const grouped = templates.reduce((acc, t) => {
    const type = t.type
    if (!acc[type]) acc[type] = []
    acc[type].push(t)
    return acc
  }, {} as Record<string, DocumentTemplate[]>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Templates</h1>
        <p className="text-zinc-500 mt-1">Manage document templates for generation</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(grouped).map(([type, typeTemplates]) => (
          <Card key={type}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {DOCUMENT_TYPE_LABELS[type as DocumentType] || type}
                </CardTitle>
                <FileText className="h-4 w-4 text-zinc-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {typeTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {template.variables.length} variables &middot;{" "}
                      {format(template.updatedAt.toDate(), "PP")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {template.isDefault && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      render={<Link href={`/documents/templates/${template.id}/edit`} />}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
