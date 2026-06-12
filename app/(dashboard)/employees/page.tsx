"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/ui/data-table"
import { getEmployees, deleteEmployee } from "@/services/employees"
import type { Employee } from "@/lib/types"
import { toast } from "sonner"

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  terminated: "destructive",
  resigned: "outline",
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    getEmployees().then(setEmployees)
  }, [])

  const handleDelete = async (id: string) => {
    if (deleting !== id) {
      setDeleting(id)
      return
    }
    try {
      await deleteEmployee(id)
      toast.success("Employee deleted")
      setEmployees((prev) => prev.filter((e) => e.id !== id))
    } catch {
      toast.error("Failed to delete")
    }
    setDeleting(null)
  }

  const columns: Column<Employee>[] = [
    {
      header: "Name",
      cell: (e) => (
        <Link href={`/employees/${e.id}`} className="font-medium hover:underline">
          {e.firstName} {e.lastName}
        </Link>
      ),
    },
    {
      header: "Email",
      cell: (e) => (
        <span className="text-zinc-500 dark:text-zinc-400">{e.email}</span>
      ),
      hideable: "md",
    },
    {
      header: "Department",
      cell: (e) => (
        <span className="text-zinc-500 dark:text-zinc-400">{e.department}</span>
      ),
    },
    {
      header: "Designation",
      cell: (e) => (
        <span className="text-zinc-500 dark:text-zinc-400">{e.designation}</span>
      ),
      hideable: "lg",
    },
    {
      header: "Status",
      cell: (e) => (
        <Badge variant={statusColor[e.status] || "outline"}>
          {e.status}
        </Badge>
      ),
    },
    {
      header: "",
      className: "w-28",
      cell: (e) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/employees/${e.id}`} />}>
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/employees/${e.id}/edit`} />}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant={deleting === e.id ? "destructive" : "ghost"}
            size="icon"
            onClick={() => handleDelete(e.id)}
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
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-zinc-500 mt-1">{employees.length} total employees</p>
        </div>
        <Button nativeButton={false} render={<Link href="/employees/add" />}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <DataTable
        data={employees}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchable
        searchPlaceholder="Search employees..."
        searchFn={(e, q) =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
        }
        filters={[
          {
            label: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Terminated", value: "terminated" },
              { label: "Resigned", value: "resigned" },
            ],
            filterFn: (e, v) => e.status === v,
          },
        ]}
      />
    </div>
  )
}
