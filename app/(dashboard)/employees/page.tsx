"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Search, Pencil, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  const [search, setSearch] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    getEmployees().then(setEmployees)
  }, [])

  const filtered = employees.filter(
    (e) =>
      e.firstName.toLowerCase().includes(search.toLowerCase()) ||
      e.lastName.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())
  )

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

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search employees..."
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
                <TableHead className="py-3.5 hidden md:table-cell">Email</TableHead>
                <TableHead className="py-3.5">Department</TableHead>
                <TableHead className="py-3.5 hidden lg:table-cell">Designation</TableHead>
                <TableHead className="py-3.5">Status</TableHead>
                <TableHead className="w-28 py-3.5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((employee) => (
                    <TableRow key={employee.id}>
                    <TableCell>
                      <Link
                        href={`/employees/${employee.id}`}
                        className="font-medium hover:underline"
                      >
                        {employee.firstName} {employee.lastName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{employee.email}</TableCell>
                    <TableCell className="text-muted-foreground">{employee.department}</TableCell>
                    <TableCell className="text-muted-foreground hidden lg:table-cell">{employee.designation}</TableCell>
                    <TableCell>
                      <Badge variant={statusColor[employee.status] || "outline"}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/employees/${employee.id}`} />}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/employees/${employee.id}/edit`} />}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={deleting === employee.id ? "destructive" : "ghost"}
                          size="icon"
                          onClick={() => handleDelete(employee.id)}
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
