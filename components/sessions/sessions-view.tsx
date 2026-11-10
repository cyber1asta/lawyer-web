'use client'

import { useMemo, useState, useEffect } from 'react'
import { CalendarClock, Check, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, XCircle } from 'lucide-react'
import { PageHeader, Card } from '@/components/shell/page-header'
import { AppButton } from '@/components/ui-kit/app-button'
import { SessionStatusBadge } from '@/components/ui-kit/badges'
import { useConfirm } from '@/components/feedback/confirm-provider'
import { PostponeDialog } from './session-form-dialog'
import { useStore } from '@/lib/store'
import { arabicMonths, arabicWeekdays, formatDate, ownerName, pad, sessionKindLabel, todayISO } from '@/lib/format'
import type { Session, SessionKind } from '@/lib/types'
import { cn } from '@/lib/utils'

const kindColor: Record<SessionKind, string> = {
  hearing: 'bg-navy text-white',
  consultation: 'bg-gold-soft text-amber-800',
  client: 'bg-emerald-50 text-emerald-800',
  deadline: 'bg-red-50 text-red-700',
}

export function SessionsView() {
  const { state, actions, ui } = useStore()
  const confirm = useConfirm()
  const today = todayISO()

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const [cursor, setCursor] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }))
  const [selectedDay, setSelectedDay] = useState(today)
  const [postponing, setPostponing] = useState<Session | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  const days = useMemo(() => {
    const first = new Date(Date.UTC(cursor.y, cursor.m, 1))
    const offset = (first.getUTCDay() + 6) % 7
    const count = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate()
    const cells: (string | null)[] = Array.from({ length: offset }, () => null)
    for (let d = 1; d <= count; d++) cells.push(`${cursor.y}-${pad(cursor.m + 1)}-${pad(d)}`)
    while (cells.length % 7) cells.push(null)
    return cells
  }, [cursor])

  const byDay = useMemo(() => {
    const m = new Map<string, Session[]>()
    for (const s of state.sessions) {
      const list = m.get(s.date) ?? []
      list.push(s)
      m.set(s.date, list)
    }
    for (const list of m.values()) list.sort((a, b) => a.time.localeCompare(b.time))
    return m
  }, [state.sessions])

  if (!mounted) {
    return null
  }

  const caseById = new Map(state.cases.map((c) => [c.id, c]))
  const dayList = byDay.get(selectedDay) ?? []

  const move = (delta: number) =>
    setCursor((c) => {
      const m = c.m + delta
      return { y: c.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 }
    })

  const onDrop = async (day: string) => {
    const s = state.sessions.find((x) => x.id === dragId)
    setDragId(null)
    if (!s || s.date === day) return
    const ok = await confirm({ title: 'نقل الموعد', description: `نقل "${s.title}" من ${formatDate(s.date)} إلى ${formatDate(day)}؟`, confirmLabel: 'نقل' })
    if (!ok) return
    const { id, ...rest } = s
    actions.saveSession({ ...rest, date: day }, id)
    setSelectedDay(day)
  }

  return (
    <>
      <PageHeader
        title="الجلسات والمواعيد"
        subtitle="اسحب أي موعد إلى يوم آخر لنقله، أو اختر يوما لإضافة موعد فيه"
        actions={
          <AppButton variant="gold" onClick={() => ui.openSessionForm(null, { date: selectedDay })}>
            <Plus className="size-4" aria-hidden />
            إضافة موعد
          </AppButton>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-bold">
              {arabicMonths[cursor.m]} {cursor.y}
            </h2>
            <div className="flex items-center gap-2">
              <AppButton variant="outline" size="icon" onClick={() => move(-1)}>
                <ChevronRight className="size-4" aria-hidden />
                <span className="sr-only">الشهر السابق</span>
              </AppButton>
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => {
                  setCursor({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 })
                  setSelectedDay(today)
                }}
              >
                اليوم
              </AppButton>
              <AppButton variant="outline" size="icon" onClick={() => move(1)}>
                <ChevronLeft className="size-4" aria-hidden />
                <span className="sr-only">الشهر التالي</span>
              </AppButton>
            </div>
          </div>
          <div className="overflow-x-auto p-3">
            <div className="grid min-w-[640px] grid-cols-7 gap-1.5">
              {arabicWeekdays.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-bold text-muted-foreground">
                  {d}
                </div>
              ))}
              {days.map((day, i) =>
                day ? (
                  <div
                    key={day}
                    role="button"
                    tabIndex={0}
                    aria-pressed={day === selectedDay}
                    aria-label={`${formatDate(day)} ${(byDay.get(day) ?? []).length} مواعيد`}
                    onClick={() => setSelectedDay(day)}
                    onDoubleClick={() => ui.openSessionForm(null, { date: day })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSelectedDay(day)
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => void onDrop(day)}
                    className={cn(
                      'group flex min-h-24 cursor-pointer flex-col gap-1 rounded-xl border p-1.5 text-start transition outline-none focus-visible:ring-3 focus-visible:ring-gold/40',
                      day === selectedDay ? 'border-gold bg-gold-soft/60' : 'border-border hover:border-gold/40 hover:bg-muted/50',
                      dragId && 'border-dashed',
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className={cn('grid size-7 place-items-center rounded-full text-xs font-bold', day === today && 'bg-navy text-white')}>
                        {Number(day.slice(8))}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          ui.openSessionForm(null, { date: day })
                        }}
                        className="rounded-md p-0.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-card hover:text-gold focus-visible:opacity-100"
                      >
                        <Plus className="size-3.5" aria-hidden />
                        <span className="sr-only">إضافة موعد في {formatDate(day)}</span>
                      </button>
                    </span>
                    {(byDay.get(day) ?? []).slice(0, 3).map((s) => (
                      <span
                        key={s.id}
                        draggable
                        onDragStart={() => setDragId(s.id)}
                        onDragEnd={() => setDragId(null)}
                        className={cn(
                          'cursor-grab truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
                          kindColor[s.kind],
                          (s.status === 'cancelled' || s.status === 'postponed') && 'line-through opacity-50',
                          s.status === 'done' && 'opacity-60',
                        )}
                      >
                        {s.time} {s.title}
                      </span>
                    ))}
                    {(byDay.get(day)?.length ?? 0) > 3 && <span className="text-[11px] text-muted-foreground">+{(byDay.get(day)?.length ?? 0) - 3}</span>}
                  </div>
                ) : (
                  <div key={`e${i}`} aria-hidden />
                ),
              )}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-bold">مواعيد {formatDate(selectedDay)}</h2>
            <AppButton size="sm" variant="soft" onClick={() => ui.openSessionForm(null, { date: selectedDay })}>
              <Plus className="size-4" aria-hidden />
              إضافة
            </AppButton>
          </div>
          {dayList.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <CalendarClock className="size-8 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">لا توجد مواعيد في هذا اليوم.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {dayList.map((s) => {
                const c = s.caseId ? caseById.get(s.caseId) : undefined
                const open = s.status === 'scheduled'
                return (
                  <li key={s.id} className="flex flex-col gap-3 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {s.time} {s.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {sessionKindLabel[s.kind]} {c && `- ${c.ref} | ${ownerName(c)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.court || '—'} {s.room && `- ${s.room}`}
                        </p>
                        {s.note && <p className="mt-1 text-xs text-amber-700">{s.note}</p>}
                      </div>
                      <SessionStatusBadge status={s.status} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <AppButton size="sm" variant="outline" onClick={() => ui.openSessionForm(s)}>
                        <Pencil className="size-3.5" aria-hidden />
                        تعديل
                      </AppButton>
                      <AppButton size="sm" variant="outline" disabled={!open} onClick={() => setPostponing(s)}>
                        <CalendarClock className="size-3.5" aria-hidden />
                        تأجيل
                      </AppButton>
                      <AppButton
                        size="sm"
                        variant="outline"
                        disabled={!open}
                        onClick={async () => {
                          if (await confirm({ title: 'تعليم كمنجز', description: `تعليم "${s.title}" كموعد منجز؟`, confirmLabel: 'منجز' })) actions.setSessionStatus(s.id, 'done')
                        }}
                      >
                        <Check className="size-3.5" aria-hidden />
                        منجز
                      </AppButton>
                      <AppButton
                        size="sm"
                        variant="outline"
                        disabled={!open}
                        onClick={async () => {
                          if (await confirm({ title: 'إلغاء الموعد', tone: 'danger', description: `إلغاء "${s.title}"؟ يمكنك التراجع خلال 8 ثوان.`, confirmLabel: 'إلغاء الموعد' }))
                            actions.setSessionStatus(s.id, 'cancelled')
                        }}
                      >
                        <XCircle className="size-3.5" aria-hidden />
                        إلغاء
                      </AppButton>
                      <AppButton
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          if (await confirm({ title: 'حذف الموعد', tone: 'danger', description: `حذف "${s.title}"؟ سينقل إلى سلة المحذوفات.`, confirmLabel: 'حذف' }))
                            actions.deleteSession(s.id)
                        }}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        حذف
                      </AppButton>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <PostponeDialog session={postponing} onClose={() => setPostponing(null)} />
    </>
  )
}