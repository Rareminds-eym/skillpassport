import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange?.(false)}
        aria-hidden="true"
      />
      {children}
    </div>
  )
}

const DialogTrigger = ({ children }) => children

const DialogContent = ({ className, children }) => (
  <div
    role="dialog"
    aria-modal="true"
    className={cn("relative z-10 w-full rounded-lg border bg-white p-6 shadow-lg", className)}
  >
    {children}
  </div>
)

const DialogHeader = ({ className, children, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)} {...props}>
    {children}
  </div>
)

const DialogFooter = ({ className, children, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props}>
    {children}
  </div>
)

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
DialogDescription.displayName = "DialogDescription"

const DialogClose = ({ children, onClose }) => (
  <button
    type="button"
    onClick={onClose}
    className="inline-flex items-center justify-center rounded-md bg-muted px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
  >
    {children ?? "Close"}
  </button>
)

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
