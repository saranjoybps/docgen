"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { addTodo } from "@/services/todos"
import { toast } from "sonner"
import { ArrowLeft, Save } from "lucide-react"

export default function AddTodoPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast.error("Title is required"); return }

    setSaving(true)
    try {
      await addTodo(title.trim())
      toast.success("Task created")
      router.push("/todos")
    } catch {
      toast.error("Failed to create task")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/todos" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Task</h1>
          <p className="text-zinc-500 mt-1">Create a new todo task</p>
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
              <Textarea id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter task title" rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" nativeButton={false} render={<Link href="/todos" />}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Task"}
          </Button>
        </div>
      </form>
    </div>
  )
}
