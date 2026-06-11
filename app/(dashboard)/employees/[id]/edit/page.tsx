"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmployeeForm } from "@/components/employees/employee-form"
import { getEmployee, updateEmployee } from "@/services/employees"
import type { EmployeeFormData } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"

export default function EditEmployeePage() {
  const params = useParams()
  const router = useRouter()
  const [defaultValues, setDefaultValues] = useState<Partial<EmployeeFormData> | undefined>(undefined)

  useEffect(() => {
    const id = params.id as string
    getEmployee(id).then((emp) => {
      if (!emp) {
        toast.error("Employee not found")
        router.push("/employees")
        return
      }
      setDefaultValues({
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        department: emp.department,
        designation: emp.designation,
        dateOfJoining: format(emp.dateOfJoining.toDate(), "yyyy-MM-dd"),
        dateOfBirth: emp.dateOfBirth ? format(emp.dateOfBirth.toDate(), "yyyy-MM-dd") : "",
        status: emp.status,
        address: emp.address,
      })
    })
  }, [params.id, router])

  const handleSubmit = async (data: EmployeeFormData) => {
    try {
      await updateEmployee(params.id as string, data)
      toast.success("Employee updated successfully")
      router.push(`/employees/${params.id}`)
    } catch {
      toast.error("Failed to update employee")
    }
  }

  if (!defaultValues) {
    return <div className="text-center py-12 text-zinc-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/employees/${params.id}`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Employee</h1>
          <p className="text-zinc-500 mt-1">Update employee information</p>
        </div>
      </div>
      <EmployeeForm defaultValues={defaultValues} onSubmit={handleSubmit} />
    </div>
  )
}
