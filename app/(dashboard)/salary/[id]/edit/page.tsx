"use client"

import { useEffect, useState, Fragment } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getEmployees } from "@/services/employees"
import { getSalaryStructure, updateSalaryStructure } from "@/services/salary"
import type { Employee } from "@/lib/types"
import { toast } from "sonner"
import { Plus, Trash2, ArrowLeft, Check } from "lucide-react"

const STEPS = ["Earnings", "Deductions", "Employer", "Review"]

export default function EditSalaryPage() {
  const params = useParams()
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [employeeId, setEmployeeId] = useState("")
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
  const [step, setStep] = useState(0)

  useEffect(() => {
    getEmployees().then(setEmployees)
  }, [])

  function formatDate(date: Date) {
    return date.toISOString().split("T")[0]
  }

  useEffect(() => {
    async function load() {
      const data = await getSalaryStructure(params.id as string)
      if (!data) {
        toast.error("Salary structure not found")
        router.push("/salary")
        return
      }
      setEmployeeId(data.employeeId)
      setBasicPay(data.basicPay)
      setDa(data.da)
      setHra(data.hra)
      setConveyanceAllowance(data.conveyanceAllowance)
      setMedicalAllowance(data.medicalAllowance)
      setSpecialAllowance(data.specialAllowance)
      setOtherAllowances(data.otherAllowances || [])
      setPf(data.pf)
      setEsi(data.esi)
      setProfessionalTax(data.professionalTax)
      setIncomeTax(data.incomeTax)
      setOtherDeductions(data.otherDeductions || [])
      setGratuity(data.gratuity)
      const dateStr = data.effectiveFrom?.toDate ? formatDate(data.effectiveFrom.toDate()) : ""
      setEffectiveFrom(dateStr)
      setAutoPf(data.pf === Math.round((data.basicPay + data.da) * 0.12))
      setLoading(false)
    }
    load()
  }, [params.id, router])

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

  const selectedEmployee = employees.find((e) => e.id === employeeId)

  const handleSave = async () => {
    if (!effectiveFrom) { toast.error("Effective date is required"); return }
    try {
      await updateSalaryStructure(params.id as string, {
        employeeId,
        basicPay, da, hra, conveyanceAllowance, medicalAllowance, specialAllowance,
        otherAllowances: otherAllowances.filter((a) => a.label && a.amount > 0),
        pf: pfValue, esi, professionalTax, incomeTax,
        otherDeductions: otherDeductions.filter((d) => d.label && d.amount > 0),
        employerPf: pfValue, employerEsi, gratuity,
        effectiveFrom,
      })
      toast.success("Salary structure updated")
      router.push("/salary")
    } catch {
      toast.error("Failed to update salary structure")
    }
  }

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/salary" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Salary Structure</h1>
          <p className="text-zinc-500 mt-1">Update salary components</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {STEPS.map((s, i) => (
          <Fragment key={s}>
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i >= step}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                i === step
                  ? "bg-zinc-900 text-white"
                  : i < step
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default"
              }`}
            >
              <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 text-[10px] sm:text-xs font-bold">
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-4 sm:w-8 h-px ${i < step ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"}`} />
            )}
          </Fragment>
        ))}
      </div>

      {/* Employee info banner */}
      {selectedEmployee && (
        <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border">
          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-semibold">
            {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
          </div>
          <div>
            <p className="font-medium">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
            <p className="text-xs text-zinc-500">{selectedEmployee.department} — {selectedEmployee.designation}</p>
          </div>
        </div>
      )}

      <div>
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Earnings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Standard Allowances</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Other Allowances</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => setOtherAllowances([...otherAllowances, { label: "", amount: 0 }])}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {otherAllowances.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic">No additional allowances added</p>
                ) : (
                  <div className="space-y-2">
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
                )}
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg flex justify-between items-center text-sm">
                <span className="font-medium">Total Earnings</span>
                <span className="font-semibold text-lg">₹{earningsTotal.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Deductions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Standard Deductions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label>Provident Fund (PF)</Label>
                      <button type="button" className={`text-xs px-1.5 py-0.5 rounded ${autoPf ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800"}`} onClick={() => setAutoPf(!autoPf)}>
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
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Other Deductions</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => setOtherDeductions([...otherDeductions, { label: "", amount: 0 }])}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {otherDeductions.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic">No additional deductions added</p>
                ) : (
                  <div className="space-y-2">
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
                )}
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg flex justify-between items-center text-sm">
                <span className="font-medium">Total Deductions</span>
                <span className="font-semibold text-lg text-red-600">- ₹{deductionsTotal.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Employer Contributions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-zinc-500">These are the employer-side contributions to statutory funds.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Employer PF</Label>
                  <Input type="number" value={pfValue} disabled />
                  <p className="text-xs text-zinc-500">Matches employee PF contribution</p>
                </div>
                <div className="space-y-1">
                  <Label>Employer ESI</Label>
                  <Input type="number" value={employerEsi} disabled />
                  <p className="text-xs text-zinc-500">3.25x of employee ESI</p>
                </div>
                <div className="space-y-1">
                  <Label>Gratuity</Label>
                  <Input type="number" value={gratuity} onChange={(e) => setGratuity(Number(e.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Confirm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedEmployee && (
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-semibold">
                    {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                    <p className="text-xs text-zinc-500">{selectedEmployee.department} — {selectedEmployee.designation}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  Effective From <span className="text-red-500">*</span>
                </Label>
                <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg space-y-2 text-sm">
                  <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 border-b pb-1 mb-2">Earnings</h4>
                  {basicPay > 0 && <div className="flex justify-between"><span>Basic Pay</span><span>₹{basicPay.toLocaleString()}</span></div>}
                  {da > 0 && <div className="flex justify-between"><span>DA</span><span>₹{da.toLocaleString()}</span></div>}
                  {hra > 0 && <div className="flex justify-between"><span>HRA</span><span>₹{hra.toLocaleString()}</span></div>}
                  {conveyanceAllowance > 0 && <div className="flex justify-between"><span>Conveyance</span><span>₹{conveyanceAllowance.toLocaleString()}</span></div>}
                  {medicalAllowance > 0 && <div className="flex justify-between"><span>Medical</span><span>₹{medicalAllowance.toLocaleString()}</span></div>}
                  {specialAllowance > 0 && <div className="flex justify-between"><span>Special</span><span>₹{specialAllowance.toLocaleString()}</span></div>}
                  {otherAllowances.filter(a => a.amount > 0).map((a, i) => (
                    <div key={i} className="flex justify-between"><span>{a.label}</span><span>₹{a.amount.toLocaleString()}</span></div>
                  ))}
                  <div className="flex justify-between font-semibold text-base border-t pt-1 mt-1">
                    <span>Gross</span>
                    <span>₹{earningsTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg space-y-2 text-sm">
                  <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 border-b pb-1 mb-2">Deductions</h4>
                  {pfValue > 0 && <div className="flex justify-between"><span>PF</span><span>₹{pfValue.toLocaleString()}</span></div>}
                  {esi > 0 && <div className="flex justify-between"><span>ESI</span><span>₹{esi.toLocaleString()}</span></div>}
                  {professionalTax > 0 && <div className="flex justify-between"><span>Professional Tax</span><span>₹{professionalTax.toLocaleString()}</span></div>}
                  {incomeTax > 0 && <div className="flex justify-between"><span>Income Tax</span><span>₹{incomeTax.toLocaleString()}</span></div>}
                  {otherDeductions.filter(d => d.amount > 0).map((d, i) => (
                    <div key={i} className="flex justify-between"><span>{d.label}</span><span>₹{d.amount.toLocaleString()}</span></div>
                  ))}
                  <div className="flex justify-between font-semibold text-base border-t pt-1 mt-1 text-red-600">
                    <span>Total</span>
                    <span>- ₹{deductionsTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between font-bold text-lg">
                  <span>Net Monthly</span>
                  <span className="text-green-600">₹{netMonthly.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-500 border-t pt-1 mt-1">
                  <span>Employer PF</span>
                  <span>₹{pfValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Employer ESI</span>
                  <span>₹{employerEsi.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Gratuity</span>
                  <span>₹{gratuity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-zinc-700 dark:text-zinc-300 border-t pt-1 mt-1">
                  <span>Cost to Company (CTC)</span>
                  <span>₹{ctc.toLocaleString()}/yr</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-3 justify-between mt-6">
          <div>
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" type="button" nativeButton={false} render={<Link href="/salary" />}>
              Cancel
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep(step + 1)}>
                Next
              </Button>
            ) : (
              <Button type="button" disabled={!effectiveFrom} onClick={handleSave}>
                Update Salary Structure
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
