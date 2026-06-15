"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"

interface SelectItemDef {
  value: string
  label: string
  groupLabel?: string
}

interface SelectContextType {
  value?: string
  onValueChange?: (value: string) => void
  items: SelectItemDef[]
  placeholder?: string
}

const SelectContext = React.createContext<SelectContextType | null>(null)

SelectContext.displayName = "SelectContext"

function Select({
  value,
  onValueChange,
  children,
}: {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}) {
  const items = extractSelectItems(children)
  const placeholder = extractPlaceholder(children)

  return (
    <SelectContext.Provider value={{ value, onValueChange, items, placeholder }}>
      {children}
    </SelectContext.Provider>
  )
}

Select.displayName = "Select"

function SelectTrigger({ className, children: _children }: { className?: string; children?: React.ReactNode }) {
  const ctx = React.useContext(SelectContext)

  const grouped = React.useMemo(() => {
    const groups = new Map<string, SelectItemDef[]>()
    for (const item of ctx?.items ?? []) {
      const key = item.groupLabel || ""
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }
    return groups
  }, [ctx?.items])

  const hasGroups = ctx?.items?.some((i) => i.groupLabel)

  return (
    <div className="relative">
      <select
        value={ctx?.value ?? ""}
        onChange={(e) => ctx?.onValueChange?.(e.target.value)}
        className={cn(
          "flex w-full appearance-none items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 pr-9 text-sm text-zinc-900 dark:text-zinc-100 transition-colors outline-none focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 focus-visible:ring-3 focus-visible:ring-zinc-400/50 dark:focus-visible:ring-zinc-500/50 disabled:cursor-not-allowed disabled:opacity-50 min-h-10",
          className
        )}
      >
        <option value="" disabled>
          {ctx?.placeholder ?? "Select..."}
        </option>
        {hasGroups
          ? Array.from(grouped.entries()).map(([groupLabel, groupItems]) => (
              <optgroup key={groupLabel} label={groupLabel}>
                {groupItems.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))
          : (ctx?.items ?? []).map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
    </div>
  )
}

SelectTrigger.displayName = "SelectTrigger"

function SelectValue(_props: { children?: React.ReactNode; placeholder?: string }) {
  return null
}

SelectValue.displayName = "SelectValue"

function SelectContent(_props: { children: React.ReactNode }) {
  return null
}

SelectContent.displayName = "SelectContent"

function SelectGroup(_props: { children: React.ReactNode }) {
  return null
}

SelectGroup.displayName = "SelectGroup"

function SelectLabel(_props: React.ComponentProps<"div">) {
  return null
}

SelectLabel.displayName = "SelectLabel"

function SelectItem(_props: { value: string; children: React.ReactNode }) {
  return null
}

SelectItem.displayName = "SelectItem"

function SelectSeparator() {
  return null
}

SelectSeparator.displayName = "SelectSeparator"

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return extractText(node.props.children)
  return ""
}

function extractSelectItems(children: React.ReactNode, groupLabel?: string): SelectItemDef[] {
  const items: SelectItemDef[] = []

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<{ children?: React.ReactNode; value?: string }>(child)) return

    if ((child.type as { displayName?: string })?.displayName === "SelectItem") {
      items.push({
        value: child.props.value as string,
        label: extractText(child.props.children),
        groupLabel,
      })
    } else if ((child.type as { displayName?: string })?.displayName === "SelectGroup") {
      let childGroupLabel = groupLabel
      React.Children.forEach(child.props.children, (grandchild) => {
        if (React.isValidElement<{ children?: React.ReactNode }>(grandchild)) {
          if ((grandchild.type as { displayName?: string })?.displayName === "SelectLabel") {
            childGroupLabel = extractText(grandchild.props.children)
          }
        }
      })
      items.push(...extractSelectItems(child.props.children, childGroupLabel))
    } else if (child.props.children) {
      items.push(...extractSelectItems(child.props.children, groupLabel))
    }
  })

  return items
}

function extractPlaceholder(children: React.ReactNode): string | undefined {
  let placeholder: string | undefined

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<{ children?: React.ReactNode; placeholder?: string }>(child)) return

    if ((child.type as { displayName?: string })?.displayName === "SelectTrigger") {
      React.Children.forEach(child.props.children, (grandchild) => {
        if (!React.isValidElement<{ placeholder?: string }>(grandchild)) return
        if ((grandchild.type as { displayName?: string })?.displayName === "SelectValue") {
          if (grandchild.props.placeholder) {
            placeholder = grandchild.props.placeholder
          }
        }
      })
    }
  })

  return placeholder
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
