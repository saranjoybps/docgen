"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users,
  FileText,
  DollarSign,
  Upload,
  UserPlus,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getEmployees } from "@/services/employees"
import { getGeneratedDocuments, getUploadedDocuments } from "@/services/documents"
import { getSalaryStructures } from "@/services/salary"
import { getCompanySettings } from "@/services/settings"
import type { Employee, GeneratedDocument, UploadedDocument, CompanySettings } from "@/lib/types"
import { format } from "date-fns"

const quickActions = [
  { label: "Add Employee", href: "/employees/add", icon: UserPlus, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
  { label: "Generate Document", href: "/documents", icon: FileText, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
  { label: "Add Salary", href: "/salary/add", icon: DollarSign, color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20" },
  { label: "Upload Document", href: "/uploads/add", icon: Upload, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
]

const statCards = [
  { title: "Total Employees", key: "employees" as const, subKey: "activeEmployees" as const, subLabel: "active", icon: Users, href: "/employees", color: "text-blue-600" },
  { title: "Generated Documents", key: "documents" as const, icon: FileText, href: "/documents", color: "text-emerald-600" },
  { title: "Salary Structures", key: "salaryStructures" as const, icon: DollarSign, href: "/salary", color: "text-violet-600" },
  { title: "Uploaded Documents", key: "uploads" as const, icon: Upload, href: "/uploads", color: "text-amber-600" },
]

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  inactive: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  terminated: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  resigned: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
}

function initials(name: string) {
  const parts = name.split(" ")
  return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2)
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ employees: 0, activeEmployees: 0, documents: 0, salaryStructures: 0, uploads: 0 })
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([])
  const [recentDocs, setRecentDocs] = useState<GeneratedDocument[]>([])
  const [recentUploads, setRecentUploads] = useState<UploadedDocument[]>([])
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [employees, documents, salaryStructures, uploads, stgs] = await Promise.all([
          getEmployees(),
          getGeneratedDocuments(),
          getSalaryStructures(),
          getUploadedDocuments(),
          getCompanySettings(),
        ])
        setStats({
          employees: employees.length,
          activeEmployees: employees.filter((e) => e.status === "active").length,
          documents: documents.length,
          salaryStructures: salaryStructures.length,
          uploads: uploads.length,
        })
        setRecentEmployees(employees.slice(0, 5))
        setRecentDocs(documents.slice(0, 5))
        setRecentUploads(uploads.slice(0, 5))
        setSettings(stgs)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const greeting = getGreeting()
  const companyName = settings?.companyName || ""

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{greeting}{companyName ? `, ${companyName.split(" ")[0]}` : ""}</h1>
          <p className="text-zinc-500 mt-1">Here&apos;s what&apos;s happening with your organization today.</p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`shrink-0 rounded-lg p-2.5 ${action.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">{action.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-auto text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const value = stats[card.key]
          return (
            <Link key={card.key} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-zinc-500">{card.title}</p>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                  {loading ? (
                    <div className="h-7 w-16 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{value}</div>
                      {card.subKey && (
                        <p className="text-xs text-zinc-500 mt-1">
                          {stats[card.subKey]} {card.subLabel}
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Employees</CardTitle>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/employees" />}>
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-28 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                      <div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentEmployees.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-zinc-400">
                <Users className="h-8 w-8" />
                <p className="text-sm">No employees yet</p>
                <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/employees/add" />}>
                  Add your first employee
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {recentEmployees.map((emp) => (
                  <Link key={emp.id} href={`/employees/${emp.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <Avatar size="sm">
                      <AvatarFallback className="text-xs">{initials(`${emp.firstName} ${emp.lastName}`)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-zinc-500 truncate">{emp.department} · {emp.designation}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[emp.status] || ""}`}>
                        {emp.status}
                      </span>
                      <span className="text-[10px] text-zinc-400">{format(emp.dateOfJoining.toDate(), "PP")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Documents</CardTitle>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/documents" />}>
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-32 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                      <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentDocs.length === 0 && recentUploads.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-zinc-400">
                <FileText className="h-8 w-8" />
                <p className="text-sm">No documents yet</p>
                <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/documents" />}>
                  Generate your first document
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {recentDocs.map((doc) => {
                  const name = doc.metadata?.employeeName || ""
                  return (
                    <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-1.5">
                        <FileText className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.type}</p>
                        <p className="text-xs text-zinc-500 truncate">{name || "—"}</p>
                      </div>
                      <span className="text-[10px] text-zinc-400 shrink-0">{format(doc.generatedAt.toDate(), "PP")}</span>
                    </div>
                  )
                })}
                {recentUploads.map((up) => (
                  <div key={up.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="shrink-0 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-1.5">
                      <Upload className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{up.originalFileName}</p>
                      <p className="text-xs text-zinc-500 truncate">{up.type}</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0">{format(up.uploadedAt.toDate(), "PP")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
