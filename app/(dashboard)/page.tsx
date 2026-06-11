"use client"

import { useEffect, useState } from "react"
import { Users, FileText, DollarSign, Upload, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getEmployees } from "@/services/employees"
import { getGeneratedDocuments, getUploadedDocuments } from "@/services/documents"
import { getSalaryStructures } from "@/services/salary"
import Link from "next/link"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    employees: 0,
    activeEmployees: 0,
    documents: 0,
    salaryStructures: 0,
    uploads: 0,
  })

  useEffect(() => {
    async function load() {
      const [employees, documents, salaryStructures, uploads] = await Promise.all([
        getEmployees(),
        getGeneratedDocuments(),
        getSalaryStructures(),
        getUploadedDocuments(),
      ])
      setStats({
        employees: employees.length,
        activeEmployees: employees.filter((e) => e.status === "active").length,
        documents: documents.length,
        salaryStructures: salaryStructures.length,
        uploads: uploads.length,
      })
    }
    load()
  }, [])

  const cards = [
    { title: "Total Employees", value: stats.employees, sub: `${stats.activeEmployees} active`, icon: Users, href: "/employees" },
    { title: "Generated Documents", value: stats.documents, icon: FileText, href: "/documents/generate" },
    { title: "Salary Structures", value: stats.salaryStructures, icon: DollarSign, href: "/salary" },
    { title: "Uploaded Documents", value: stats.uploads, icon: Upload, href: "/uploads" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Overview of your document management system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.title} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-500">{card.title}</CardTitle>
                  <Icon className="h-4 w-4 text-zinc-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  {card.sub && (
                    <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      {card.sub}
                      <ArrowUpRight className="h-3 w-3" />
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
