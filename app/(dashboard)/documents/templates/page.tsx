"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { getTemplates, deleteTemplate } from "@/services/templates"
import type { DocumentTemplate } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"
import { Plus, Pencil, Trash2, FileText } from "lucide-react"

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTemplates()
      .then(setTemplates)
      .catch(() => toast.error("Failed to load templates"))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (deleting !== id) {
      setDeleting(id)
      return
    }
    try {
      await deleteTemplate(id)
      toast.success("Template deleted")
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch {
      toast.error("Failed to delete template")
    }
    setDeleting(null)
  }

  const columns: Column<DocumentTemplate>[] = [
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
        <span className="text-zinc-500 dark:text-zinc-400">
          {format(t.updatedAt.toDate(), "PP")}
        </span>
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
            onClick={() => handleDelete(t.id)}
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
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-zinc-500 mt-1">{templates.length} total templates</p>
        </div>
        <Button nativeButton={false} render={<Link href="/documents/templates/add" />}>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      <DataTable
        data={templates}
        columns={columns}
        keyExtractor={(t) => t.id}
        loading={loading}
        emptyMessage="No templates found"
        searchable
        searchPlaceholder="Search templates..."
        searchFn={(t, q) => t.name.toLowerCase().includes(q)}
      />
    </div>
  )
}
