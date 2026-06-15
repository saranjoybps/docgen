"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { getEmployees } from "@/services/employees"
import { getSalaryStructures, deleteSalaryStructure } from "@/services/salary"
import type { Employee, SalaryStructure } from "@/lib/types"
import { format } from "date-fns"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"

export default function SalaryPage() {
  const searchParams = useSearchParams()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [salaries, setSalaries] = useState<SalaryStructure[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>()
    employees.forEach((e) => map.set(e.id, e))
    return map
  }, [employees])

  useEffect(() => {
    getEmployees().then(setEmployees).catch(() => toast.error("Failed to load employees"))
  }, [])

  useEffect(() => {
    const employeeId = searchParams.get("employeeId")
    getSalaryStructures(employeeId || undefined).then(setSalaries).catch(() => toast.error("Failed to load salary data"))
  }, [searchParams])

  const handleDelete = async (id: string) => {
    if (deleting !== id) {
      setDeleting(id)
      return
    }
    try {
      await deleteSalaryStructure(id)
      toast.success("Salary structure deleted")
      setSalaries((prev) => prev.filter((s) => s.id !== id))
    } catch {
      toast.error("Failed to delete")
    }
    setDeleting(null)
  }

  const columns: Column<SalaryStructure>[] = [
    {
      header: "Employee",
      cell: (s) => {
        const emp = employeeMap.get(s.employeeId)
        return (
          <span className="font-medium">
            {emp ? `${emp.firstName} ${emp.lastName}` : s.employeeId.slice(0, 8) + "..."}
          </span>
        )
      },
    },
    {
      header: "Gross /mo",
      cell: (s) => `₹${(s.grossEarnings ?? 0).toLocaleString()}`,
    },
    {
      header: "Deductions /mo",
      cell: (s) => (
        <span className="text-red-600">₹{(s.totalDeductions ?? 0).toLocaleString()}</span>
      ),
    },
    {
      header: "Net /mo",
      cell: (s) => (
        <span className="text-green-600 font-medium">₹{s.netSalary.toLocaleString()}</span>
      ),
    },
    {
      header: "CTC /yr",
      cell: (s) => (
        <span className="text-zinc-500 dark:text-zinc-400">₹{(s.ctc ?? 0).toLocaleString()}</span>
      ),
    },
    {
      header: "Effective",
      cell: (s) => (
        <span className="text-zinc-500 dark:text-zinc-400">
          {format(s.effectiveFrom.toDate(), "PP")}
        </span>
      ),
    },
    {
      header: "",
      className: "w-20",
      cell: (s) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/salary/${s.id}/edit`} />}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant={deleting === s.id ? "destructive" : "ghost"}
            size="icon"
            onClick={() => handleDelete(s.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const employeeOptions = useMemo(
    () =>
      employees
        .filter((e) => salaries.some((s) => s.employeeId === e.id))
        .map((e) => ({
          label: `${e.firstName} ${e.lastName}`,
          value: e.id,
        })),
    [employees, salaries]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salary Structure</h1>
          <p className="text-zinc-500 mt-1">Manage salary structures for employees</p>
        </div>
        <Button nativeButton={false} render={<Link href="/salary/add" />}>
          <Plus className="h-4 w-4 mr-2" />
          Add Salary Structure
        </Button>
      </div>

      <DataTable
        data={salaries}
        columns={columns}
        keyExtractor={(s) => s.id}
        emptyMessage="No salary structures found"
        searchable
        searchPlaceholder="Search by employee name..."
        searchFn={(s, q) => {
          const emp = employeeMap.get(s.employeeId)
          const name = emp ? `${emp.firstName} ${emp.lastName}` : ""
          return name.toLowerCase().includes(q)
        }}
        filters={
          employeeOptions.length > 1
            ? [
                {
                  label: "Employee",
                  options: employeeOptions,
                  filterFn: (s, v) => s.employeeId === v,
                },
              ]
            : undefined
        }
      />
    </div>
  )
}
