'use client'

import { useId, useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, parseDisplayDate, toLatinDigits } from '@/lib/format'

const control =
  'h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-gold focus:ring-3 focus:ring-gold/20 aria-invalid:border-red-500 aria-invalid:ring-red-500/15'

interface FieldShellProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: (id: string, describedBy?: string) => ReactNode
}

export function FieldShell({ label, required, error, hint, className, children }: FieldShellProps) {
  const id = useId()
  const msgId = `${id}-msg`
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="ms-1 text-red-600" aria-hidden>*</span>}
      </label>
      {children(id, error || hint ? msgId : undefined)}
      {error ? (
        <p id={msgId} className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

type BaseProps = { label: string; required?: boolean; error?: string; hint?: string; className?: string }

export function TextField({ label, required, error, hint, className, onChange, ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint} className={className}>
      {(id, describedBy) => (
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required}
          className={control}
          onChange={(e) => {
            e.target.value = toLatinDigits(e.target.value)
            onChange?.(e)
          }}
          {...props}
        />
      )}
    </FieldShell>
  )
}

export function SelectField({ label, required, error, hint, className, children, ...props }: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint} className={className}>
      {(id, describedBy) => (
        <select id={id} aria-invalid={!!error} aria-describedby={describedBy} aria-required={required} className={control} {...props}>
          {children}
        </select>
      )}
    </FieldShell>
  )
}

export function TextAreaField({ label, required, error, hint, className, ...props }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint} className={className}>
      {(id, describedBy) => (
        <textarea
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(control, 'h-auto min-h-24 py-3 leading-relaxed')}
          {...props}
        />
      )}
    </FieldShell>
  )
}

interface DateFieldProps extends BaseProps {
  value: string | null
  onChange: (iso: string | null) => void
}

export function DateField({ label, required, error, hint, className, value, onChange }: DateFieldProps) {
  const [text, setText] = useState(value ? formatDate(value) : '')
  const [lastValue, setLastValue] = useState(value)
  const picker = useRef<HTMLInputElement>(null)

  if (value !== lastValue) {
    setLastValue(value)
    setText(value ? formatDate(value) : '')
  }

  const handleText = (raw: string) => {
    let digits = toLatinDigits(raw).replace(/[^\d]/g, '').slice(0, 8)
    if (digits.length > 4) digits = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    else if (digits.length > 2) digits = `${digits.slice(0, 2)}/${digits.slice(2)}`
    setText(digits)
    const iso = parseDisplayDate(digits)
    if (iso) {
      setLastValue(iso)
      onChange(iso)
    } else if (!digits) {
      setLastValue(null)
      onChange(null)
    }
  }

  const localError = text && !parseDisplayDate(text) && text.length === 10 ? 'تاريخ غير صحيح' : undefined

  return (
    <FieldShell label={label} required={required} error={error ?? localError} hint={hint ?? 'يوم/شهر/سنة'} className={className}>
      {(id, describedBy) => (
        <div className="relative">
          <input
            id={id}
            dir="ltr"
            inputMode="numeric"
            placeholder="26/11/2026"
            aria-invalid={!!(error ?? localError)}
            aria-describedby={describedBy}
            aria-required={required}
            value={text}
            onChange={(e) => handleText(e.target.value)}
            className={cn(control, 'pe-11 text-right')}
          />
          <button
            type="button"
            onClick={() => picker.current?.showPicker?.()}
            className="absolute inset-y-0 end-0 grid w-11 place-items-center text-muted-foreground hover:text-gold"
          >
            <CalendarDays className="size-4" aria-hidden />
            <span className="sr-only">اختيار التاريخ من التقويم</span>
          </button>
          <input
            ref={picker}
            type="date"
            tabIndex={-1}
            aria-hidden
            value={value ?? ''}
            onChange={(e) => {
              const iso = e.target.value || null
              setLastValue(iso)
              setText(iso ? formatDate(iso) : '')
              onChange(iso)
            }}
            className="pointer-events-none absolute end-0 bottom-0 size-0 opacity-0"
          />
        </div>
      )}
    </FieldShell>
  )
}
