"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-orientation={orientation}
      className={cn(
        "flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

type TabsListVariant = "default" | "line"

const tabsListVariants: Record<TabsListVariant, string> = {
  default: "bg-zinc-100 dark:bg-zinc-800",
  line: "gap-1 bg-transparent",
}

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & { variant?: TabsListVariant }) {
  return (
    <TabsPrimitive.List
      data-variant={variant}
      className={cn(
        "inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-zinc-500 dark:text-zinc-400 data-horizontal:h-8 data-vertical:h-fit data-vertical:flex-col data-[variant=line]:rounded-none",
        tabsListVariants[variant],
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-zinc-900/60 dark:text-zinc-100/60 transition-all data-vertical:w-full data-vertical:justify-start hover:text-zinc-900 dark:hover:text-zinc-100 focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 focus-visible:ring-[3px] focus-visible:ring-zinc-400/50 dark:focus-visible:ring-zinc-500/50 focus-visible:outline-1 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-white dark:data-active:bg-zinc-950 data-active:text-zinc-900 dark:data-active:text-zinc-100 dark:data-active:border-zinc-700 dark:data-active:bg-zinc-700/30 dark:data-active:text-zinc-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
