"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getEmployees } from "@/services/employees"
import { addSalaryStructure, getSalaryStructures } from "@/services/salary"
import type { Employee, SalaryStructure } from "@/lib/types"
import { format } from "date-fns"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"

const salarySchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  basicPay: z.number().min(0, "Must be positive"),
  hra: z.number().min(0, "Must be positive"),
  da: z.number().min(0, "Must be positive"),
  otherAllowances: z.array(z.object({ label: z.string(), amount: z.number() })).default([]),
  deductions: z.array(z.object({ label: z.string(), amount: z.number() })).default([]),
  effectiveFrom: z.string().min(1, "Effective date is required"),
})

type SchemaType = z.infer<typeof salarySchema>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const salaryResolver = zodResolver(salarySchema) as any

export default function SalaryPage() {
  const searchParams = useSearchParams()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [salaries, setSalaries] = useState<SalaryStructure[]>([])
  const [allowances, setAllowances] = useState<{ label: string; amount: number }[]>([])
  const [deductions, setDeductions] = useState<{ label: string; amount: number }[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SchemaType>({
    resolver: salaryResolver,
    defaultValues: {
      employeeId: searchParams.get("employeeId") || "",
      basicPay: 0,
      hra: 0,
      da: 0,
      effectiveFrom: "",
    },
  })

  const employeeId = watch("employeeId")

  useEffect(() => {
    async function load() {
      const emps = await getEmployees()
      setEmployees(emps)
      if (searchParams.get("employeeId")) {
        const sals = await getSalaryStructures(searchParams.get("employeeId")!)
        setSalaries(sals)
      }
    }
    load()
  }, [searchParams])

  useEffect(() => {
    if (employeeId) {
      getSalaryStructures(employeeId).then(setSalaries)
    }
  }, [employeeId])

  const addAllowance = () => {
    setAllowances([...allowances, { label: "", amount: 0 }])
  }

  const updateAllowance = (index: number, field: "label" | "amount", value: string | number) => {
    const updated = [...allowances]
    updated[index] = { ...updated[index], [field]: value }
    setAllowances(updated)
  }

  const removeAllowance = (index: number) => {
    setAllowances(allowances.filter((_, i) => i !== index))
  }

  const addDeduction = () => {
    setDeductions([...deductions, { label: "", amount: 0 }])
  }

  const updateDeduction = (index: number, field: "label" | "amount", value: string | number) => {
    const updated = [...deductions]
    updated[index] = { ...updated[index], [field]: value }
    setDeductions(updated)
  }

  const removeDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index))
  }

  const handleFormSubmit = async (data: SchemaType) => {
    try {
      await addSalaryStructure({
        ...data,
        otherAllowances: allowances.filter((a) => a.label && a.amount > 0),
        deductions: deductions.filter((d) => d.label && d.amount > 0),
      })
      toast.success("Salary structure added")
      reset()
      setAllowances([])
      setDeductions([])
      if (employeeId) {
        const sals = await getSalaryStructures(employeeId)
        setSalaries(sals)
      }
    } catch {
      toast.error("Failed to add salary structure")
    }
  }

  const totalAllowances = allowances.reduce((s, a) => s + a.amount, 0)
  const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0)
  const gross = (watch("basicPay") || 0) + (watch("hra") || 0) + (watch("da") || 0) + totalAllowances
  const net = gross - totalDeductions

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Salary Structure</h1>
        <p className="text-zinc-500 mt-1">Define salary components for employees</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Salary Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select
                  value={employeeId}
                   {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                   onValueChange={(v: any) => setValue("employeeId", v || "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} - {emp.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employeeId && (
                  <p className="text-sm text-red-500">{errors.employeeId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Basic Pay</Label>
                  <Input type="number" {...register("basicPay")} />
                </div>
                <div className="space-y-2">
                  <Label>HRA</Label>
                  <Input type="number" {...register("hra")} />
                </div>
                <div className="space-y-2">
                  <Label>DA</Label>
                  <Input type="number" {...register("da")} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Other Allowances</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAllowance}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {allowances.map((a, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Input
                      placeholder="Label"
                      value={a.label}
                      onChange={(e) => updateAllowance(i, "label", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      className="w-32"
                      value={a.amount}
                      onChange={(e) => updateAllowance(i, "amount", Number(e.target.value))}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAllowance(i)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Deductions</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addDeduction}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {deductions.map((d, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Input
                      placeholder="Label"
                      value={d.label}
                      onChange={(e) => updateDeduction(i, "label", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      className="w-32"
                      value={d.amount}
                      onChange={(e) => updateDeduction(i, "amount", Number(e.target.value))}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDeduction(i)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Effective From</Label>
                <Input type="date" {...register("effectiveFrom")} />
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Gross Salary:</span>
                  <span className="font-medium">₹{gross.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Deductions:</span>
                  <span className="font-medium text-red-600">-₹{totalDeductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t pt-1 mt-1">
                  <span>Net Salary:</span>
                  <span className="text-green-600">₹{net.toLocaleString()}</span>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Salary Structure"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Effective</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                      Select an employee to see salary history
                    </TableCell>
                  </TableRow>
                ) : (
                  salaries.map((s) => {
                    const emp = employees.find((e) => e.id === s.employeeId)
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          {emp ? `${emp.firstName} ${emp.lastName}` : "Unknown"}
                        </TableCell>
                        <TableCell>₹{s.grossSalary.toLocaleString()}</TableCell>
                        <TableCell>₹{s.netSalary.toLocaleString()}</TableCell>
                        <TableCell className="text-zinc-500">
                          {format(s.effectiveFrom.toDate(), "PP")}
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
    </div>
  )
}
