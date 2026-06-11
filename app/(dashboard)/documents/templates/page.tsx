"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { getTemplates, deleteTemplate } from "@/services/templates"
import type { DocumentTemplate } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"
import { Plus, Pencil, Trash2, Search, FileText } from "lucide-react"

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [search, setSearch] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTemplates = useCallback(async () => {
    try {
      const result = await getTemplates()
      setTemplates(result)
    } catch {
      toast.error("Failed to load templates")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

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

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12 text-zinc-500">Loading...</div>
  }

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

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search templates..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="py-3.5">Name</TableHead>
                <TableHead className="py-3.5 hidden md:table-cell">Variables</TableHead>
                <TableHead className="py-3.5 hidden lg:table-cell">Updated</TableHead>
                <TableHead className="w-20 py-3.5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-zinc-400 shrink-0" />
                        {template.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground py-3.5 hidden md:table-cell">
                      {template.variables.length} variables
                    </TableCell>
                    <TableCell className="text-muted-foreground py-3.5 hidden lg:table-cell">
                      {format(template.updatedAt.toDate(), "PP")}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/documents/templates/${template.id}/edit`} />}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={deleting === template.id ? "destructive" : "ghost"}
                          size="icon"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
