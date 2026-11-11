'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Bell, CalendarClock, FolderOpen, Gavel, Plus } from 'lucide-react'
import { PageHeader, Card } from '@/components/shell/page-header'
import { AppButton } from '@/components/ui-kit/app-button'
import { CaseStatusBadge, NoticeBadge } from '@/components/ui-kit/badges'
import { useStore } from '@/lib/store'
import { addDays, caseStatusLabel, formatDate, ownerName, sessionKindLabel, todayISO } from '@/lib/format'
import type { CaseStatus } from '@/lib/types'

const statusBar: Record<CaseStatus, string> = {
  active: 'bg-blue-500',
  postponed: 'bg-amber-500',
  judged: 'bg-emerald-500',
  appealed: 'bg-violet-500',
  archived: 'bg-slate-400',
}

export function DashboardView() {
  const { state, ui } = useStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // منع أي اختلاف بين الخادم والمتصفح أثناء التحميل الأولي
  }

  const today = todayISO()
  const weekEnd = addDays(today, 7)
  const upcoming = state.sessions
    .filter((s) => s.status === 'scheduled' && s.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const thisWeek = upcoming.filter((s) => s.date <= weekEnd)
  const notReceived = state.cases.filter((c) => c.noticeStatus === 'not_received' && c.status !== 'archived')
  const caseById = new Map(state.cases.map((c) => [c.id, c]))

  const stats = [
    { label: 'ملفات جارية', value: state.cases.filter((c) => c.status === 'active').length, icon: FolderOpen, href: '/cases' },
    { label: 'مواعيد هذا الأسبوع', value: thisWeek.length, icon: CalendarClock, href: '/sessions' },
    { label: 'لم يتم التوصل بالإشعار', value: notReceived.length, icon: AlertCircle, href: '/cases' },
    { label: 'ملفات محكومة', value: state.cases.filter((c) => c.status === 'judged').length, icon: Gavel, href: '/reports' },
  ]

  const total = state.cases.length || 1

  return (
    <>
      <PageHeader
        title="لوحة القيادة"
        subtitle={`مرحبا ${state.office.lawyerName}، اليوم ${formatDate(today)}`}
        actions={
          <AppButton variant="gold" onClick={() => ui.openCaseForm()}>
            <Plus className="size-4" aria-hidden />
            إضافة ملف جديد
          </AppButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-xl bg-navy text-gold">
                <s.icon className="size-5" aria-hidden />
              </span>
              <ArrowLeft className="size-4 text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-gold" aria-hidden />
            </div>
            <p className="mt-4 font-heading text-4xl font-extrabold text-navy">{s.value}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-bold">المواعيد القادمة</h2>
            <Link href="/sessions" className="text-sm font-semibold text-gold hover:underline">
              عرض التقويم
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">لا توجد مواعيد قادمة.</p>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.slice(0, 6).map((s) => {
                const c = s.caseId ? caseById.get(s.caseId) : undefined
                const soon = s.date <= addDays(today, 2)
                return (
                  <li key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className={`flex w-16 shrink-0 flex-col items-center rounded-xl py-2 ${soon ? 'bg-red-50 text-red-700' : 'bg-muted text-navy'}`}>
                      <span className="font-heading text-xl font-extrabold">{s.date.slice(8, 10)}</span>
                      <span className="text-[11px] font-semibold">{s.date.slice(5, 7)}/{s.date.slice(0, 4)}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">
                        {s.title} {c && <span className="font-medium text-muted-foreground">({ownerName(c)})</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {sessionKindLabel[s.kind]} • {s.time} {s.court ? `• ${s.court}` : ''} {s.room ? `• ${s.room}` : ''}
                      </p>
                    </div>
                    {c && <span className="hidden text-xs font-bold text-muted-foreground sm:block">{c.ref}</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold">توزيع الملفات حسب الحالة</h2>
          </div>
          <div className="flex flex-col gap-4 p-5">
            {(Object.keys(caseStatusLabel) as CaseStatus[]).map((st) => {
              const n = state.cases.filter((c) => c.status === st).length
              return (
                <div key={st}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-semibold">{caseStatusLabel[st]}</span>
                    <span className="font-bold">{n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${statusBar[st]} transition-all duration-700`} style={{ width: `${(n / total) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-bold">ملفات تحتاج متابعة التبليغ</h2>
            <Link href="/cases" className="text-sm font-semibold text-gold hover:underline">
              كل الملفات
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {notReceived.slice(0, 6).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm">
                <span className="w-28 font-bold">{c.ref}</span>
                <span className="flex-1 font-semibold">{ownerName(c)}</span>
                <span className="text-muted-foreground">{c.court}</span>
                <NoticeBadge status={c.noticeStatus} />
                <CaseStatusBadge status={c.status} />
              </li>
            ))}
            {notReceived.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted-foreground">جميع الإشعارات تم التوصل بها.</li>}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-bold">آخر النشاطات</h2>
            <Link href="/notifications" className="text-sm font-semibold text-gold hover:underline">
              الكل
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {state.notifications.slice(0, 6).map((n) => (
              <li key={n.id} className="flex gap-3 px-5 py-3.5">
                <Bell className={`mt-0.5 size-4 shrink-0 ${n.read ? 'text-muted-foreground' : 'text-gold'}`} aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-bold">{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}