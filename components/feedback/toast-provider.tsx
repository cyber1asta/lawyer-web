'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, Undo2, X } from 'lucide-react'

interface ToastOptions {
  message: string
  onUndo?: () => void
}

interface ToastState extends ToastOptions {
  key: number
}

const UNDO_MS = 8000
const ToastContext = createContext<{ show: (t: ToastOptions) => void } | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setToast(null)
  }, [])

  const show = useCallback((t: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current)
    setToast({ ...t, key: Date.now() })
    timer.current = setTimeout(() => setToast(null), t.onUndo ? UNDO_MS : 3500)
  }, [])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="no-print pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
        {toast && (
          <div
            key={toast.key}
            role="status"
            className="pointer-events-auto relative flex w-full max-w-md items-center gap-3 overflow-hidden rounded-xl bg-navy px-4 py-3 text-white shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4"
          >
            <CheckCircle2 className="size-5 shrink-0 text-emerald-400" aria-hidden />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            {toast.onUndo && (
              <button
                type="button"
                onClick={() => {
                  toast.onUndo?.()
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-navy transition hover:brightness-110"
              >
                <Undo2 className="size-4" aria-hidden />
                تراجع
              </button>
            )}
            <button type="button" onClick={dismiss} className="rounded-md p-1 text-white/60 hover:text-white">
              <X className="size-4" aria-hidden />
              <span className="sr-only">إغلاق الإشعار</span>
            </button>
            {toast.onUndo && (
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-0.5 origin-right bg-gold"
                style={{ animation: `toast-progress ${UNDO_MS}ms linear forwards` }}
              />
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
