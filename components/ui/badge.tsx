import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"

const badgeVariants: Record<BadgeVariant, string> = {
  default:
    "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900",
  secondary:
    "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100",
  destructive:
    "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 dark:bg-red-900/20",
  outline:
    "border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100",
  ghost:
    "hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-500 dark:hover:text-zinc-400 dark:hover:bg-zinc-800/50",
  link:
    "text-zinc-900 dark:text-zinc-100 underline-offset-4 hover:underline",
}

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 focus-visible:ring-[3px] focus-visible:ring-zinc-400/50 dark:focus-visible:ring-zinc-500/50 aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
