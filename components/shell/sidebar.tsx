'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { BarChart3, Bell, CalendarDays, FolderOpen, LayoutGrid, PlusCircle, Scale, Settings, Trash2, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'

const links = [
  { href: '/', label: 'لوحة القيادة', icon: LayoutGrid },
  { href: '/cases', label: 'ملفات القضايا', icon: FolderOpen },
  { href: '/sessions', label: 'الجلسات والمواعيد', icon: CalendarDays },
  { href: '/notifications', label: 'الإشعارات', icon: Bell },
  { href: '/reports', label: 'التقارير', icon: BarChart3 },
  { href: '/trash', label: 'سلة المحذوفات', icon: Trash2 },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
  { href: '/admin-panel', label: 'إدارة المستخدمين', icon: ShieldAlert },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { state, ui } = useStore()

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (currentPath: string, href: string) => {
    if (href === '/') {
      return currentPath === '/'
    }
    return currentPath.startsWith(href)
  }

  return (
    <div className="flex h-full flex-col bg-sidebar px-3 py-6 text-sidebar-foreground overflow-y-auto">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-3 px-2">
        <span className="grid size-11 place-items-center rounded-xl bg-gold text-navy shadow-md">
          <Scale className="size-6" />
        </span>
        <div className="flex flex-col">
          <span className="font-tajawal text-base font-bold tracking-tight text-white">تدبير القضايا</span>
          <span className="text-xs text-sidebar-foreground/70">نظام إدارة الملفات القضائية</span>
        </div>
      </Link>

      <nav aria-label="القائمة الرئيسية" className="mt-10 flex flex-1 flex-col gap-1">
        {links.slice(0, 2).map((l) => (
          <NavItem key={l.href} {...l} active={isActive(pathname, l.href)} onNavigate={onNavigate} />
        ))}

        <div className="my-2 px-2">
          <button
            type="button"
            onClick={() => {
              ui.openCaseForm()
              onNavigate?.()
            }}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-navy bg-gold hover:bg-gold/90 transition-all shadow-sm w-full group cursor-pointer"
          >
            <PlusCircle className="size-5 shrink-0" aria-hidden />
            <span className="truncate">إضافة ملف</span>
          </button>
        </div>

        {links.slice(2).map((l) => (
          <NavItem key={l.href} {...l} active={isActive(pathname, l.href)} onNavigate={onNavigate} />
        ))}
      </nav>

      {mounted && state.lawyerInfo && (
        <div className="mt-auto pt-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 rounded-xl bg-navy-dark/50 p-3 border border-sidebar-border/50">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-gold/10 text-gold font-bold text-sm">
              {state.lawyerInfo.name ? state.lawyerInfo.name.charAt(0) : 'أ'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-xs font-bold text-white">{state.lawyerInfo.name || 'مكتب المحاماة'}</span>
              <span className="truncate text-[10px] text-sidebar-foreground/70">{state.lawyerInfo.barAssociation || 'هيئة المحامين'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string
  label: string
  icon: any
  active: boolean
  onNavigate?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all group',
        active
          ? 'bg-sidebar-accent text-gold font-bold shadow-sm'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white'
      )}
    >
      <Icon className={cn('size-5 shrink-0 transition-transform group-hover:scale-110', active ? 'text-gold' : 'text-sidebar-foreground/70')} aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  )
}