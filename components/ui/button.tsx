import { Button as ButtonPrimitive } from "@base-ui/react/button"

import { cn } from "@/lib/utils"

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
type ButtonSize = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"

const buttonVariants: Record<ButtonVariant, string> = {
  default: "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200",
  outline:
    "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 aria-expanded:bg-zinc-100 dark:aria-expanded:bg-zinc-800 aria-expanded:text-zinc-900 dark:aria-expanded:text-zinc-100 dark:border-zinc-700 dark:bg-zinc-700/30 dark:hover:bg-zinc-700/50",
  secondary:
    "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 aria-expanded:bg-zinc-100 dark:aria-expanded:bg-zinc-800 aria-expanded:text-zinc-900 dark:aria-expanded:text-zinc-100",
  ghost:
    "hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 aria-expanded:bg-zinc-100 dark:aria-expanded:bg-zinc-800 aria-expanded:text-zinc-900 dark:aria-expanded:text-zinc-100 dark:hover:bg-zinc-800/50",
  destructive:
    "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus-visible:border-red-500/40 focus-visible:ring-red-500/20 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:focus-visible:ring-red-500/40",
  link: "text-zinc-900 dark:text-zinc-100 underline-offset-4 hover:underline",
}

const buttonSizes: Record<ButtonSize, string> = {
  default: "h-8 gap-1.5 px-2.5",
  xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
  sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
  lg: "h-9 gap-1.5 px-2.5",
  icon: "size-8",
  "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-3",
  "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)]",
  "icon-lg": "size-9",
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <ButtonPrimitive
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500 focus-visible:ring-3 focus-visible:ring-zinc-400/50 dark:focus-visible:ring-zinc-500/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-3 aria-invalid:ring-red-500/20 dark:aria-invalid:border-red-500/50 dark:aria-invalid:ring-red-500/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    />
  )
}

export { Button }
