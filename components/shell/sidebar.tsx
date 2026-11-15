'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
<<<<<<< HEAD
import { BarChart3, Bell, CalendarDays, FolderOpen, LayoutGrid, PlusCircle, Scale, Settings, Trash2, ShieldAlert } from 'lucide-react'
=======
import { BarChart3, Bell, CalendarDays, FolderOpen, LayoutGrid, PlusCircle, Scale, Settings, Trash2 } from 'lucide-react'
>>>>>>> debbd568e0a0978a92029616c9d8b7614efe5fcc
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'

const links = [
  { href: '/', label: 'لوحة القيادة', icon: LayoutGrid },
  { href: '/cases', label: 'ملفات القضايا', icon: FolderOpen },
  { href: '/sessions', label: 'الجلسات والمواعيد', icon: CalendarDays },
  { href: '/notifications', label: 'الإشعارات', icon: Bell, badge: true },
  { href: '/reports', label: 'التقارير', icon: BarChart3 },
  { href: '/trash', label: 'سلة المحذوفات', icon: Trash2 },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
<<<<<<< HEAD
  { href: '/admin-panel', label: 'إدارة المستخدمين', icon: ShieldAlert },
=======
>>>>>>> debbd568e0a0978a92029616c9d8b7614efe5fcc
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
<<<<<<< HEAD
  const { state } = useStore()
=======
  const { state, ui } = useStore()
>>>>>>> debbd568e0a0978a92029616c9d8b7614efe5fcc

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const unread = mounted ? state.notifications.filter((n) => !n.read).length : 0

  return (
<<<<<<< HEAD
    <div className="flex h-full flex-col bg-sidebar px-3 py-6 text-sidebar-foreground overflow-hidden">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-3 px-2">
        <span className="grid size-11 place-items-center rounded-xl bg-gold text-navy shadow-lg shadow-gold/20 shrink-0">
          <Scale className="size-6" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block font-heading text-xl font-extrabold text-white truncate">تدبير القضايا</span>
          <span className="block text-xs text-sidebar-foreground/70 truncate">نظام إدارة الملفات القضائية</span>
        </span>
      </Link>

      <nav aria-label="القائمة الرئيسية" className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
=======
    <div className="flex h-full flex-col bg-sidebar px-4 py-6 text-sidebar-foreground">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-3 px-2">
        <span className="grid size-11 place-items-center rounded-xl bg-gold text-navy shadow-lg shadow-gold/20">
          <Scale className="size-6" aria-hidden />
        </span>
        <span>
          <span className="block font-heading text-xl font-extrabold text-white">تدبير القضايا</span>
          <span className="block text-xs text-sidebar-foreground/70">نظام إدارة الملفات القضائية</span>
        </span>
      </Link>

      <nav aria-label="القائمة الرئيسية" className="mt-10 flex flex-1 flex-col gap-1">
>>>>>>> debbd568e0a0978a92029616c9d8b7614efe5fcc
        {links.slice(0, 2).map((l) => (
          <NavItem key={l.href} {...l} active={isActive(pathname, l.href)} onNavigate={onNavigate} />
        ))}
        <button
          type="button"
          onClick={() => {
<<<<<<< HEAD
            // @ts-ignore
            window.dispatchEvent(new CustomEvent('open-case-form'))
=======
            ui.openCaseForm()
>>>>>>> debbd568e0a0978a92029616c9d8b7614efe5fcc
            onNavigate?.()
          }}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-sidebar-foreground/85 transition hover:bg-sidebar-accent/60 hover:text-white"
        >
<<<<<<< HEAD
          <PlusCircle className="size-5 shrink-0" aria-hidden />
          <span className="truncate">إضافة ملف</span>
=======
          <PlusCircle className="size-5" aria-hidden />
          إضافة ملف
>>>>>>> debbd568e0a0978a92029616c9d8b7614efe5fcc
        </button>
        {links.slice(2).map((l) => (
          <NavItem
            key={l.href}
            {...l}
            active={isActive(pathname, l.href)}
            count={l.badge && mounted ? unread : undefined}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

<<<<<<< HEAD
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-sidebar-accent/70 p-3 shrink-0">
        <span className="grid size-10 place-items-center rounded-full bg-gold font-bold text-navy shrink-0">ح</span>
=======
      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-sidebar-accent/70 p-3">
        <span className="grid size-10 place-items-center rounded-full bg-gold font-bold text-navy">ح</span>
>>>>>>> debbd568e0a0978a92029616c9d8b7614efe5fcc
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-white">{mounted ? state.office.officeName : 'مكتب الأستاذة حسناء'}</span>
          <span className="block truncate text-xs text-sidebar-foreground/70">{mounted ? state.office.bar : 'هيئة المحامين بالرباط'}</span>
        </span>
      </div>
    </div>
  )
}

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  count,
  onNavigate,
}: {
  href: string
  label: string
  icon: typeof LayoutGrid
  active: boolean
  count?: number
  onNavigate?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition',
        active ? 'bg-sidebar-accent text-white shadow-inner' : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-white',
      )}
    >
      {active && <span aria-hidden className="absolute inset-y-2 start-0 w-1 rounded-full bg-gold" />}
<<<<<<< HEAD
      <Icon className={cn('size-5 shrink-0', active && 'text-gold')} aria-hidden />
      <span className="flex-1 truncate">{label}</span>
      {!!count && (
        <span className="grid min-w-6 place-items-center rounded-full bg-gold px-1.5 text-xs font-bold text-navy shrink-0">
=======
      <Icon className={cn('size-5', active && 'text-gold')} aria-hidden />
      <span className="flex-1">{label}</span>
      {!!count && (
        <span className="grid min-w-6 place-items-center rounded-full bg-gold px-1.5 text-xs font-bold text-navy">
>>>>>>> debbd568e0a0978a92029616c9d8b7614efe5fcc
          {count}
          <span className="sr-only">إشعارات غير مقروءة</span>
        </span>
      )}
    </Link>
  )
}