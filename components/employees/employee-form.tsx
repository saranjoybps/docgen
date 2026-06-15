"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { EmployeeFormData, CompanySettings } from "@/lib/types"
import { CalendarIcon, Building2 } from "lucide-react"
import Link from "next/link"
import { listCompanySettings } from "@/services/settings"

const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  dateOfBirth: z.string().optional(),
  lastWorkingDate: z.string().optional(),
  status: z.enum(["active", "inactive", "terminated", "resigned"]),
  address: z.string().min(1, "Address is required"),
  companyId: z.string().min(1, "Company is required"),
})

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeFormData>
  onSubmit: (data: EmployeeFormData) => Promise<void>
  cancelHref?: string
}

export function EmployeeForm({ defaultValues, onSubmit, cancelHref }: EmployeeFormProps) {
  const [companies, setCompanies] = useState<(CompanySettings & { id: string })[]>([])

  useEffect(() => {
    listCompanySettings().then(setCompanies)
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: (async (values: any) => {
      const parsed = employeeSchema.safeParse(values)
      if (parsed.success) return { values: parsed.data, errors: {} }
      const fieldErrors: Record<string, { message: string }> = {}
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = { message: issue.message }
      }
      return { values: {} as Record<string, never>, errors: fieldErrors }
    }) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      designation: "",
      dateOfJoining: "",
      dateOfBirth: "",
      lastWorkingDate: "",
      status: "active",
      address: "",
      companyId: "",
      ...defaultValues,
    },
  })

  const status = watch("status")

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" {...register("department")} />
              {errors.department && (
                <p className="text-sm text-red-500">{errors.department.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" {...register("designation")} />
              {errors.designation && (
                <p className="text-sm text-red-500">{errors.designation.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfJoining">Date of Joining</Label>
              <div className="relative">
                <Input id="dateOfJoining" type="date" {...register("dateOfJoining")} />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
              {errors.dateOfJoining && (
                <p className="text-sm text-red-500">{errors.dateOfJoining.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastWorkingDate">Last Working Date</Label>
              <Input id="lastWorkingDate" type="date" {...register("lastWorkingDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value: any) =>
                  setValue("status", (value || "active") as EmployeeFormData["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                  <SelectItem value="resigned">Resigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyId">Company</Label>
              {companies.length === 0 ? (
                <div className="text-sm text-zinc-400 border rounded-md px-3 py-2">
                  No companies — add one in{" "}
                  <Link href="/settings" className="text-blue-600 underline">Settings</Link>
                </div>
              ) : (
                <Select
                  value={watch("companyId")}
                  onValueChange={(value) => setValue("companyId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company">
                      {watch("companyId")
                        ? companies.find((c) => c.id === watch("companyId"))?.companyName || "Select company"
                        : "Select company"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                          {c.companyName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.companyId && (
                <p className="text-sm text-red-500">{errors.companyId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={3} {...register("address")} />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            {cancelHref && (
              <Button variant="outline" type="button" nativeButton={false} render={<Link href={cancelHref} />}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Employee"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
