'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { Modal } from './modal'
import { AppButton } from '@/components/ui-kit/app-button'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  tone?: 'danger' | 'default'
}

const ConfirmContext = createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback((o: ConfirmOptions) => {
    setOptions(o)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
  }

  const danger = options?.tone === 'danger'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!options}
        onClose={() => close(false)}
        title={options?.title ?? ''}
        size="sm"
        footer={
          <>
            <AppButton variant="outline" onClick={() => close(false)}>
              إلغاء
            </AppButton>
            <AppButton variant={danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
              {options?.confirmLabel ?? 'تأكيد'}
            </AppButton>
          </>
        }
      >
        <div className="flex items-start gap-4">
          <span
            className={
              danger
                ? 'grid size-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-600'
                : 'grid size-11 shrink-0 place-items-center rounded-full bg-gold-soft text-gold'
            }
          >
            {danger ? <AlertTriangle className="size-5" aria-hidden /> : <HelpCircle className="size-5" aria-hidden />}
          </span>
          <p className="pt-2 text-sm leading-relaxed text-muted-foreground">
            {options?.description ?? 'هل تريد المتابعة؟ يمكنك التراجع عن العملية خلال 8 ثوان.'}
          </p>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider')
  return ctx
}
