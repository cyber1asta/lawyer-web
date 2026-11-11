import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'gold' | 'outline' | 'ghost' | 'danger' | 'soft'

const variants: Record<Variant, string> = {
  primary: 'bg-navy text-white hover:bg-navy-soft shadow-sm',
  gold: 'bg-gold text-navy hover:brightness-105 shadow-sm shadow-gold/30',
  outline: 'border border-border bg-card text-foreground hover:bg-muted',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  soft: 'bg-muted text-foreground hover:bg-border',
}

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'icon'
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(function AppButton(
  { variant = 'primary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-bold whitespace-nowrap transition-all outline-none select-none',
        'focus-visible:ring-3 focus-visible:ring-gold/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        size === 'md' && 'h-11 px-5 text-sm',
        size === 'sm' && 'h-9 px-3 text-xs',
        size === 'icon' && 'size-9',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
})
