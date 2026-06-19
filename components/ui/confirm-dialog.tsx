"use client"

import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  variant?: "destructive" | "default"
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "destructive",
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md rounded-xl bg-white dark:bg-zinc-900 shadow-2xl transition-all duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95">
          <div className="p-5">
            <Dialog.Title className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {title}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {message}
            </Dialog.Description>
          </div>
          <div className="flex items-center justify-end gap-3 px-5 pb-5">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
            <Button
              variant={variant}
              size="sm"
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
