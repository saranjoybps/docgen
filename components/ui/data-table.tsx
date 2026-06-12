"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface Column<T> {
  header: string
  cell: (item: T) => React.ReactNode
  className?: string
  hideable?: boolean | "sm" | "md" | "lg"
}

interface FilterConfig<T> {
  label: string
  options: { label: string; value: string }[]
  filterFn: (item: T, value: string) => boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  loading?: boolean
  emptyMessage?: string
  searchable?: boolean
  searchPlaceholder?: string
  searchFn?: (item: T, query: string) => boolean
  filters?: FilterConfig<T>[]
  pageSize?: number
  pageSizeOptions?: number[]
}

function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading,
  emptyMessage = "No records found",
  searchable = false,
  searchPlaceholder = "Search...",
  searchFn,
  filters,
  pageSize: defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("")
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string>>({})
  const [page, setPage] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(defaultPageSize)

  const filtered = React.useMemo(() => {
    let result = data

    if (search && searchFn) {
      result = result.filter((item) => searchFn(item, search))
    }

    if (filters) {
      for (const filter of filters) {
        const activeValue = activeFilters[filter.label]
        if (activeValue) {
          result = result.filter((item) => filter.filterFn(item, activeValue))
        }
      }
    }

    return result
  }, [data, search, searchFn, filters, activeFilters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paginatedData = React.useMemo(() => {
    const start = safePage * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  function getHideClass(hideable: Column<T>["hideable"]): string {
    if (hideable === true || hideable === "sm") return "hidden sm:table-cell"
    if (hideable === "md") return "hidden md:table-cell"
    if (hideable === "lg") return "hidden lg:table-cell"
    return ""
  }

  return (
    <div className="space-y-4">
      {(searchable || (filters && filters.length > 0)) && (
        <div className="flex flex-wrap gap-3 items-center">
          {searchable && searchFn && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}
          {filters?.map((filter) => (
            <select
              key={filter.label}
              value={activeFilters[filter.label] || ""}
              onChange={(e) =>
                setActiveFilters((prev) => ({
                  ...prev,
                  [filter.label]: e.target.value,
                }))
              }
              className="h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 pr-8 text-sm text-zinc-900 dark:text-zinc-100 appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="">All {filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-900 hover:bg-zinc-900">
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className={cn(
                    "text-zinc-100 font-semibold",
                    getHideClass(col.hideable),
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-zinc-500"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-zinc-500"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={keyExtractor(item)}>
                  {columns.map((col, i) => (
                    <TableCell
                      key={i}
                      className={cn(getHideClass(col.hideable), col.className)}
                    >
                      {col.cell(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <span>
              {safePage * pageSize + 1}–
              {Math.min((safePage + 1) * pageSize, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(0)
              }}
              className="h-8 rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-2 text-xs text-zinc-900 dark:text-zinc-100"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - (safePage + 1)) <= 1
              )
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1">...</span>
                  )}
                  <Button
                    variant={safePage + 1 === p ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "min-w-[32px]",
                      safePage + 1 === p &&
                        "bg-zinc-900 text-white hover:bg-zinc-800"
                    )}
                    onClick={() => setPage(p - 1)}
                  >
                    {p}
                  </Button>
                </React.Fragment>
              ))}
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export { DataTable }
