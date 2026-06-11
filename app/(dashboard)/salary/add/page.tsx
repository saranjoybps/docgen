"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { getEmployees } from "@/services/employees"
import { addSalaryStructure } from "@/services/salary"
import type { Employee } from "@/lib/types"
import { toast } from "sonner"
import { Plus, Trash2, ChevronDown, ChevronUp, Calculator, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AddSalaryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeId, setEmployeeId] = useState(searchParams.get("employeeId") || "")
  const [basicPay, setBasicPay] = useState(0)
  const [da, setDa] = useState(0)
  const [hra, setHra] = useState(0)
  const [conveyanceAllowance, setConveyanceAllowance] = useState(0)
  const [medicalAllowance, setMedicalAllowance] = useState(0)
  const [specialAllowance, setSpecialAllowance] = useState(0)
  const [otherAllowances, setOtherAllowances] = useState<{ label: string; amount: number }[]>([])
  const [pf, setPf] = useState(0)
  const [esi, setEsi] = useState(0)
  const [professionalTax, setProfessionalTax] = useState(0)
  const [incomeTax, setIncomeTax] = useState(0)
  const [otherDeductions, setOtherDeductions] = useState<{ label: string; amount: number }[]>([])
  const [gratuity, setGratuity] = useState(0)
  const [effectiveFrom, setEffectiveFrom] = useState("")
  const [autoPf, setAutoPf] = useState(true)
  const [earningOpen, setEarningOpen] = useState(true)
  const [deductionOpen, setDeductionOpen] = useState(true)
  const [employerOpen, setEmployerOpen] = useState(true)

  useEffect(() => {
    getEmployees().then(setEmployees)
  }, [])

  const earningsTotal =
    basicPay + da + hra + conveyanceAllowance + medicalAllowance + specialAllowance +
    otherAllowances.reduce((s, a) => s + a.amount, 0)

  const pfValue = autoPf ? Math.round((basicPay + da) * 0.12) : pf

  const deductionsTotal =
    pfValue + esi + professionalTax + incomeTax +
    otherDeductions.reduce((s, d) => s + d.amount, 0)

  const netMonthly = earningsTotal - deductionsTotal
  const employerEsi = esi * 3.25
  const ctc = (earningsTotal + pfValue + employerEsi) * 12 + gratuity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId) { toast.error("Select an employee"); return }
    if (!effectiveFrom) { toast.error("Effective date is required"); return }
    try {
      await addSalaryStructure({
        employeeId,
        basicPay, da, hra, conveyanceAllowance, medicalAllowance, specialAllowance,
        otherAllowances: otherAllowances.filter((a) => a.label && a.amount > 0),
        pf: pfValue, esi, professionalTax, incomeTax,
        otherDeductions: otherDeductions.filter((d) => d.label && d.amount > 0),
        employerPf: pfValue, employerEsi, gratuity,
        effectiveFrom,
      })
      toast.success("Salary structure added")
      router.push("/salary")
    } catch {
      toast.error("Failed to add salary structure")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/salary" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Salary Structure</h1>
          <p className="text-zinc-500 mt-1">Define salary components for an employee</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={employeeId} onValueChange={(v: any) => setEmployeeId(v || "")}>
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
            </div>

            <div className="space-y-3">
              <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setEarningOpen(!earningOpen)}>
                <span className="font-semibold">Monthly Earnings</span>
                {earningOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {earningOpen && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Basic Pay</Label>
                      <Input type="number" value={basicPay} onChange={(e) => setBasicPay(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Dearness Allowance (DA)</Label>
                      <Input type="number" value={da} onChange={(e) => setDa(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label>House Rent Allowance (HRA)</Label>
                      <Input type="number" value={hra} onChange={(e) => setHra(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Conveyance Allowance</Label>
                      <Input type="number" value={conveyanceAllowance} onChange={(e) => setConveyanceAllowance(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Medical Allowance</Label>
                      <Input type="number" value={medicalAllowance} onChange={(e) => setMedicalAllowance(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Special Allowance</Label>
                      <Input type="number" value={specialAllowance} onChange={(e) => setSpecialAllowance(Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Other Allowances</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => setOtherAllowances([...otherAllowances, { label: "", amount: 0 }])}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {otherAllowances.map((a, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <Input placeholder="Label" value={a.label} onChange={(e) => {
                          const u = [...otherAllowances]; u[i] = { ...u[i], label: e.target.value }; setOtherAllowances(u)
                        }} />
                        <Input type="number" placeholder="Amount" className="w-32" value={a.amount} onChange={(e) => {
                          const u = [...otherAllowances]; u[i] = { ...u[i], amount: Number(e.target.value) }; setOtherAllowances(u)
                        }} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setOtherAllowances(otherAllowances.filter((_, j) => j !== i))}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setDeductionOpen(!deductionOpen)}>
                <span className="font-semibold">Monthly Deductions</span>
                {deductionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {deductionOpen && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label>Provident Fund (PF)</Label>
                        <button type="button" className={`text-xs px-1.5 py-0.5 rounded ${autoPf ? "bg-primary text-primary-foreground" : "bg-muted"}`} onClick={() => setAutoPf(!autoPf)}>
                          <Calculator className="h-3 w-3 inline mr-0.5" />
                          {autoPf ? "Auto" : "Manual"}
                        </button>
                      </div>
                      <Input type="number" value={pfValue} disabled={autoPf} onChange={(e) => setPf(Number(e.target.value))} />
                      {autoPf && <p className="text-xs text-zinc-500">12% of (Basic + DA)</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Employee State Insurance (ESI)</Label>
                      <Input type="number" value={esi} onChange={(e) => setEsi(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Professional Tax</Label>
                      <Input type="number" value={professionalTax} onChange={(e) => setProfessionalTax(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Income Tax (TDS)</Label>
                      <Input type="number" value={incomeTax} onChange={(e) => setIncomeTax(Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Other Deductions</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => setOtherDeductions([...otherDeductions, { label: "", amount: 0 }])}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {otherDeductions.map((d, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <Input placeholder="Label" value={d.label} onChange={(e) => {
                          const u = [...otherDeductions]; u[i] = { ...u[i], label: e.target.value }; setOtherDeductions(u)
                        }} />
                        <Input type="number" placeholder="Amount" className="w-32" value={d.amount} onChange={(e) => {
                          const u = [...otherDeductions]; u[i] = { ...u[i], amount: Number(e.target.value) }; setOtherDeductions(u)
                        }} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setOtherDeductions(otherDeductions.filter((_, j) => j !== i))}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setEmployerOpen(!employerOpen)}>
                <span className="font-semibold">Employer Contributions</span>
                {employerOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {employerOpen && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Employer PF (auto)</Label>
                      <Input type="number" value={pfValue} disabled />
                    </div>
                    <div className="space-y-1">
                      <Label>Employer ESI (auto)</Label>
                      <Input type="number" value={employerEsi} disabled />
                    </div>
                    <div className="space-y-1">
                      <Label>Gratuity</Label>
                      <Input type="number" value={gratuity} onChange={(e) => setGratuity(Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Effective From</Label>
              <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Gross Monthly:</span>
                <span className="font-medium">₹{earningsTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Deductions:</span>
                <span className="font-medium text-red-600">- ₹{deductionsTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-1 mt-1">
                <span>Net Monthly:</span>
                <span className="text-green-600">₹{netMonthly.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1 text-xs text-zinc-500">
                <span>Cost to Company (CTC):</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">₹{ctc.toLocaleString()}/yr</span>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!employeeId}>
              Save Salary Structure
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}