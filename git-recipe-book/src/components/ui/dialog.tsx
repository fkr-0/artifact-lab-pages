import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'
import { createPortal } from 'react-dom'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  ariaLabel?: string
}

function Dialog({ open, onOpenChange, children, ariaLabel = 'Dialog' }: DialogProps) {
  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 border-0 bg-black/50"
            onClick={() => onOpenChange(false)}
            aria-label={`Close ${ariaLabel}`}
          />
          <motion.dialog
            open
            key="content"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 m-auto max-h-[80vh] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-lg border border-border bg-card p-0 text-card-foreground shadow-xl"
            aria-label={ariaLabel}
            onCancel={(event) => {
              event.preventDefault()
              onOpenChange(false)
            }}
          >
            {children}
          </motion.dialog>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6 pb-0 text-center sm:text-left', className)} {...props} />
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
}

function DialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props} />
}

interface DialogTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

function DialogTrigger({ children }: DialogTriggerProps) {
  return <>{children}</>
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger }
