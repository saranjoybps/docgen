import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-900 dark:file:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 focus-visible:ring-3 focus-visible:ring-zinc-400/50 dark:focus-visible:ring-zinc-500/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-zinc-200/50 dark:disabled:bg-zinc-700/50 disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-3 aria-invalid:ring-red-500/20 md:text-sm dark:bg-zinc-700/30 dark:disabled:bg-zinc-700/80 dark:aria-invalid:border-red-500/50 dark:aria-invalid:ring-red-500/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
