"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTodo, updateTodo } from "@/services/todos"
import { toast } from "sonner"
import { ArrowLeft, Save } from "lucide-react"

export default function EditTodoPage() {
  const params = useParams()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = params.id as string
    getTodo(id).then((todo) => {
      if (!todo) { toast.error("Task not found"); router.push("/todos"); return }
      setTitle(todo.title)
      setLoading(false)
    })
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast.error("Title is required"); return }

    setSaving(true)
    try {
      await updateTodo(params.id as string, title.trim())
      toast.success("Task updated")
      router.push("/todos")
    } catch {
      toast.error("Failed to update task")
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
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/todos" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Task</h1>
          <p className="text-zinc-500 mt-1">Update your task</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Textarea id="title" value={title} onChange={(e) => setTitle(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" nativeButton={false} render={<Link href="/todos" />}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
