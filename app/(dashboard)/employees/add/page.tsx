"use client"

import { useRouter } from "next/navigation"
import { EmployeeForm } from "@/components/employees/employee-form"
import { addEmployee } from "@/services/employees"
import type { EmployeeFormData } from "@/lib/types"
import { toast } from "sonner"

export default function AddEmployeePage() {
  const router = useRouter()

  const handleSubmit = async (data: EmployeeFormData) => {
    try {
      await addEmployee(data)
      toast.success("Employee added successfully")
      router.push("/employees")
    } catch {
      toast.error("Failed to add employee")
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Employee</h1>
        <p className="text-zinc-500 mt-1">Add a new employee to the system</p>
      </div>
      <EmployeeForm onSubmit={handleSubmit} />
    </div>
  )
}
