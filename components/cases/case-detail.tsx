'use client'

import type { ReactNode } from 'react'
import { Archive, CalendarPlus, Download, Pencil, Printer, Trash2, X } from 'lucide-react'
import { AppButton } from '@/components/ui-kit/app-button'
import { CaseStatusBadge, NoticeBadge, SessionStatusBadge } from '@/components/ui-kit/badges'
import { useConfirm } from '@/components/feedback/confirm-provider'
import { nextSessionFor, useStore } from '@/lib/store'
import { caseStatusLabel, downloadFile, formatDate, formatMAD, formatPhone, lineage, noticeStatusLabel, ownerName, toCsv } from '@/lib/format'
import type { CaseFile } from '@/lib/types'

export function CaseDetail({ c, onClose }: { c: CaseFile; onClose?: () => void }) {
  const { state, actions, ui } = useStore()
  const confirm = useConfirm()
  const next = nextSessionFor(state.sessions, c.id)
  const caseSessions = state.sessions.filter((s) => s.caseId === c.id).sort((a, b) => b.date.localeCompare(a.date))

  const exportCase = () => {
    const rows: (string | number)[][] = [
      ['الحقل', 'القيمة'],
      ['رقم الملف', c.ref],
      ['رقم الملف بالمحكمة', c.courtRef],
      ['صاحب القضية', ownerName(c)],
      ['النسب', lineage(c)],
      ['الهاتف', formatPhone(c.phone)],
      ['البطاقة الوطنية', c.cin],
      ['المدينة', c.city],
      ['نوع القضية', c.type],
      ['المحكمة', c.court],
      ['تاريخ القضية', formatDate(c.caseDate)],
      ['الطرف الآخر', c.opponent],
      ['المبلغ', formatMAD(c.amount)],
      ['حالة الإشعار', noticeStatusLabel[c.noticeStatus]],
      ['تاريخ التوصل', formatDate(c.noticeDate)],
      ['طريقة التبليغ', c.noticeMethod],
      ['الحالة', caseStatusLabel[c.status]],
      ['الجلسة المقبلة', next ? `${formatDate(next.date)} ${next.time}` : '—'],
      ['ملاحظات', c.notes],
    ]
    downloadFile(`ملف-${c.ref}.csv`, toCsv(rows))
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm print:border-0 print:shadow-none">
      <header className="relative bg-navy px-6 py-6 text-white">
        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gold font-heading text-2xl font-extrabold text-navy">
            {c.firstName.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold text-balance">{ownerName(c)}</h2>
            <p className="mt-1 text-sm text-white/70">ملف رقم {c.ref}</p>
          </div>
          <CaseStatusBadge status={c.status} />
          {onClose && (
            <button type="button" onClick={onClose} className="no-print rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
              <X className="size-5" aria-hidden />
              <span className="sr-only">إغلاق التفاصيل</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 divide-y divide-border overflow-y-auto">
        <Section title="المعلومات الشخصية">
          <Info label="الاسم الكامل" value={`${c.firstName} ${c.familyName}`} />
          <Info label="النسب" value={lineage(c)} />
          <Info label="رقم الهاتف" value={<span dir="ltr">{formatPhone(c.phone)}</span>} />
          <Info label="المدينة" value={c.city || '—'} />
          <Info label="البطاقة الوطنية" value={c.cin || '—'} />
        </Section>
        <Section title="معلومات القضية">
          <Info label="نوع القضية" value={c.type} />
          <Info label="تاريخ القضية" value={formatDate(c.caseDate)} />
          <Info label="المحكمة" value={c.court} wide />
          <Info label="رقم الملف بالمحكمة" value={<span dir="ltr">{c.courtRef || '—'}</span>} />
          <Info label="الطرف الآخر" value={c.opponent || '—'} />
          <Info label="المبلغ المطلوب" value={formatMAD(c.amount)} />
          <Info label="الجلسة المقبلة" value={next ? `${formatDate(next.date)} - ${next.time}` : 'لا توجد'} />
        </Section>
        <Section title="الإشعار">
          <Info label="تاريخ التوصل بالإشعار" value={formatDate(c.noticeDate)} />
          <Info label="طريقة التبليغ" value={c.noticeMethod} />
          <Info label="حالة الإشعار" value={<NoticeBadge status={c.noticeStatus} />} />
        </Section>
        <section className="px-6 py-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">الجلسات والمواعيد</h3>
            <AppButton size="sm" variant="soft" className="no-print" onClick={() => ui.openSessionForm(null, { caseId: c.id })}>
              <CalendarPlus className="size-4" aria-hidden />
              إضافة موعد
            </AppButton>
          </div>
          {caseSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد مواعيد مسجلة لهذا الملف.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {caseSessions.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2 text-sm">
                  <span>
                    <span className="font-semibold">{s.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(s.date)} - {s.time} {s.room && `- ${s.room}`}
                    </span>
                  </span>
                  <SessionStatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="px-6 py-5">
          <h3 className="mb-2 font-bold">ملاحظات</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{c.notes || 'لا توجد ملاحظات.'}</p>
        </section>
      </div>

      <footer className="no-print grid grid-cols-2 gap-2 border-t border-border p-4 sm:grid-cols-5">
        <AppButton className="col-span-2" onClick={() => ui.openCaseForm(c)}>
          <Pencil className="size-4" aria-hidden />
          تعديل الملف
        </AppButton>
        <AppButton variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden />
          طباعة
        </AppButton>
        <AppButton variant="outline" onClick={exportCase}>
          <Download className="size-4" aria-hidden />
          تصدير
        </AppButton>
        <div className="col-span-2 flex gap-2 sm:col-span-1">
          <AppButton
            variant="outline"
            size="icon"
            className="h-11 flex-1"
            disabled={c.status === 'archived'}
            onClick={async () => {
              const ok = await confirm({ title: 'أرشفة الملف', description: `سيتم نقل الملف ${c.ref} إلى الأرشيف. يمكنك التراجع خلال 8 ثوان.`, confirmLabel: 'أرشفة' })
              if (ok) actions.setCasesStatus([c.id], 'archived')
            }}
          >
            <Archive className="size-4" aria-hidden />
            <span className="sr-only">أرشفة</span>
          </AppButton>
          <AppButton
            variant="outline"
            size="icon"
            className="h-11 flex-1 text-red-600 hover:bg-red-50"
            onClick={async () => {
              const ok = await confirm({
                title: 'حذف الملف',
                tone: 'danger',
                description: `هل تريد حذف الملف ${c.ref} الخاص بـ ${ownerName(c)}؟ سينقل إلى سلة المحذوفات ويمكنك التراجع خلال 8 ثوان.`,
                confirmLabel: 'حذف',
              })
              if (ok) {
                actions.deleteCases([c.id])
                onClose?.()
              }
            }}
          >
            <Trash2 className="size-4" aria-hidden />
            <span className="sr-only">حذف</span>
          </AppButton>
        </div>
      </footer>
    </article>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="px-6 py-5">
      <h3 className="mb-4 font-bold">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</dl>
    </section>
  )
}

function Info({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-bold">{value}</dd>
    </div>
  )
}
