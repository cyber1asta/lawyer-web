'use client'

import { useState, type ReactNode } from 'react'
import { Menu, Scale, X } from 'lucide-react'
import { Sidebar } from './sidebar'
import { CaseFormDialog } from '@/components/cases/case-form-dialog'
import { SessionFormDialog } from '@/components/sessions/session-form-dialog'

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="no-print sticky top-0 hidden h-dvh w-72 shrink-0 lg:block">
        <Sidebar />
      </aside>

      <div className="no-print sticky top-0 z-30 flex items-center justify-between bg-navy px-4 py-3 text-white lg:hidden">
        <span className="flex items-center gap-2 font-heading text-lg font-extrabold">
          <Scale className="size-5 text-gold" aria-hidden />
          تدبير القضايا
        </span>
        <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-white/10" aria-expanded={mobileOpen}>
          <Menu className="size-5" aria-hidden />
          <span className="sr-only">فتح القائمة</span>
        </button>
      </div>

      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="إغلاق القائمة" className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 start-0 w-72 animate-in slide-in-from-right">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button type="button" onClick={() => setMobileOpen(false)} className="absolute top-4 end-3 rounded-lg p-2 text-white/70 hover:text-white">
              <X className="size-5" aria-hidden />
              <span className="sr-only">إغلاق القائمة</span>
            </button>
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>

      <CaseFormDialog />
      <SessionFormDialog />
    </div>
  )
}
