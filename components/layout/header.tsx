"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, LogOut, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth/auth-provider"
import { logoutUser } from "@/services/auth"
import { getEmployees } from "@/services/employees"
import { getTemplates } from "@/services/templates"
import { getTodos } from "@/services/todos"
import { getGeneratedDocuments } from "@/services/documents"

interface SearchResult {
  label: string
  description: string
  href: string
}

export function Header() {
  const { user } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const [emps, tmpls, todos, docs] = await Promise.all([
        getEmployees(),
        getTemplates(),
        getTodos(),
        getGeneratedDocuments(),
      ])
      const activeEmpIds = new Set<string>()
      const lower = q.toLowerCase()
      const found: SearchResult[] = []

      for (const e of emps) {
        if (e.status !== "active") continue
        activeEmpIds.add(e.id)
        const name = `${e.firstName} ${e.lastName}`
        if (name.toLowerCase().includes(lower) || e.email.toLowerCase().includes(lower)) {
          found.push({ label: name, description: e.email, href: `/employees/${e.id}` })
        }
      }
      for (const t of tmpls) {
        if (t.name.toLowerCase().includes(lower)) {
          found.push({ label: t.name, description: "Template", href: `/documents/templates/${t.id}/edit` })
        }
      }
      for (const t of todos) {
        if (t.completed) continue
        if (t.title.toLowerCase().includes(lower)) {
          found.push({ label: t.title, description: "Todo", href: `/todos/${t.id}/edit` })
        }
      }
      for (const d of docs) {
        if (!activeEmpIds.has(d.employeeId)) continue
        if (d.type.toLowerCase().includes(lower) || d.metadata?.employeeName?.toLowerCase().includes(lower)) {
          found.push({ label: d.type, description: d.metadata?.employeeName || "Document", href: `/documents` })
        }
      }

      setResults(found.slice(0, 10))
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 200)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handler = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
          e.preventDefault()
          inputRef.current?.focus()
        }
      }
      window.addEventListener("keydown", handler)
      return () => window.removeEventListener("keydown", handler)
    }
  }, [])

  const handleLogout = async () => {
    await logoutUser()
    router.push("/login")
  }

  const initials = (name?: string | null) => {
    if (!name) return "?"
    return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-4 px-4 lg:px-6 h-14">
        <div className="relative flex-1 max-w-md" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true) }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search employees, documents, todos... (Ctrl+K)"
            className="pl-9 h-9 text-sm"
          />
          {searchOpen && (results.length > 0 || searching || query.trim()) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto">
              {searching ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Searching...
                </div>
              ) : results.length > 0 ? (
                results.map((r, i) => (
                  <button
                    key={`${r.href}-${i}`}
                    onClick={() => { setSearchOpen(false); setQuery(""); router.push(r.href) }}
                    className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex flex-col gap-0.5"
                  >
                    <span className="text-sm font-medium">{r.label}</span>
                    <span className="text-xs text-zinc-400">{r.description}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-zinc-400">No results found</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sign out"
            className="text-zinc-500 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </Button>
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-zinc-800 text-zinc-100">
              {initials(user?.displayName || user?.email)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}