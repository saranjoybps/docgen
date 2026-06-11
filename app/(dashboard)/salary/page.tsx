"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
    getEmployees().then(setEmployees)
  }, [])

  useEffect(() => {
    const employeeId = searchParams.get("employeeId")
    getSalaryStructures(employeeId || undefined).then(setSalaries)
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

      <Card>
        <CardHeader>
          <CardTitle>Salary History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="py-3.5">Employee</TableHead>
                <TableHead className="py-3.5">Gross /mo</TableHead>
                <TableHead className="py-3.5">Deductions /mo</TableHead>
                <TableHead className="py-3.5">Net /mo</TableHead>
                <TableHead className="py-3.5">CTC /yr</TableHead>
                <TableHead className="py-3.5">Effective</TableHead>
                <TableHead className="w-24 py-3.5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                    No salary structures found
                  </TableCell>
                </TableRow>
              ) : (
                salaries.map((s) => {
                  const emp = employeeMap.get(s.employeeId)
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium py-3.5">
                        {emp ? `${emp.firstName} ${emp.lastName}` : s.employeeId.slice(0, 8) + "..."}
                      </TableCell>
                      <TableCell className="py-3.5">₹{(s.grossEarnings ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-red-600 py-3.5">₹{(s.totalDeductions ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-green-600 font-medium py-3.5">₹{s.netSalary.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground py-3.5">₹{(s.ctc ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground py-3.5">
                        {format(s.effectiveFrom.toDate(), "PP")}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
