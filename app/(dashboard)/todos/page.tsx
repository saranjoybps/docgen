"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getTodos, deleteTodo, toggleTodo } from "@/services/todos"
import type { Todo } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => toast.error("Failed to load tasks"))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id)
      toast.success("Task deleted")
      setTodos((prev) => prev.filter((t) => t.id !== id))
    } catch { toast.error("Failed to delete") }
    setDeleteTarget(null)
  }

  const handleToggle = async (todo: Todo) => {
    try {
      await toggleTodo(todo.id, !todo.completed)
      setTodos((prev) => prev.map((t) => t.id === todo.id ? { ...t, completed: !t.completed } : t))
    } catch { toast.error("Failed to update") }
  }

  if (loading) {
    return <div className="text-center py-12 text-zinc-500">Loading...</div>
  }

  const sorted = [...todos].sort((a, b) => Number(a.completed) - Number(b.completed))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Todo</h1>
          <p className="text-zinc-500 mt-1">{todos.filter((t) => !t.completed).length} pending · {todos.filter((t) => t.completed).length} completed</p>
        </div>
        <Button nativeButton={false} render={<Link href="/todos/add" />}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {todos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-400">
            <p className="font-medium">No tasks yet</p>
            <p className="text-sm mt-1">Add your first task to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((todo) => (
            <Card key={todo.id} className={todo.completed ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <button onClick={() => handleToggle(todo)} className="mt-0.5 shrink-0 text-zinc-400 hover:text-primary transition-colors">
                    {todo.completed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium whitespace-pre-wrap ${todo.completed ? "line-through text-zinc-400" : ""}`}>{todo.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{format(todo.createdAt.toDate(), "PP")}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/todos/${todo.id}/edit`} />}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(todo.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </div>
  )
}
