import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 focus-visible:ring-3 focus-visible:ring-zinc-400/50 dark:focus-visible:ring-zinc-500/50 disabled:cursor-not-allowed disabled:bg-zinc-200/50 dark:disabled:bg-zinc-700/50 disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-3 aria-invalid:ring-red-500/20 md:text-sm dark:bg-zinc-700/30 dark:disabled:bg-zinc-700/80 dark:aria-invalid:border-red-500/50 dark:aria-invalid:ring-red-500/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
