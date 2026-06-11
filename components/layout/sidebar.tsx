"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  FileText,
  DollarSign,
  Upload,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { logoutUser } from "@/services/auth"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/salary", label: "Salary Structure", icon: DollarSign },
  { href: "/documents/generate", label: "Generate Documents", icon: FileText },
  { href: "/documents/templates", label: "Templates", icon: FileText },
  { href: "/uploads", label: "Upload Documents", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logoutUser()
    router.push("/login")
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 text-zinc-100 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-zinc-700">
            <Link href="/" className="text-xl font-bold tracking-tight">
              DocuCraft
            </Link>
            <button onClick={() => setOpen(false)} className="lg:hidden">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-zinc-700">
            <Button
              variant="ghost"
              className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
