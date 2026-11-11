'use client'

import { Download, Printer } from 'lucide-react'
import { PageHeader, Card } from '@/components/shell/page-header'
import { AppButton } from '@/components/ui-kit/app-button'
import { useStore } from '@/lib/store'
import { caseStatusLabel, downloadFile, formatMAD, formatNumber, noticeStatusLabel, toCsv } from '@/lib/format'
import type { CaseFile } from '@/lib/types'

function groupCount(cases: CaseFile[], key: (c: CaseFile) => string) {
  const m = new Map<string, number>()
  for (const c of cases) m.set(key(c), (m.get(key(c)) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

export function ReportsView() {
  const { state } = useStore()
  const cases = state.cases
  const byType = groupCount(cases, (c) => c.type)
  const byCourt = groupCount(cases, (c) => c.court)
  const byCity = groupCount(cases, (c) => c.city || 'غير محددة')
  const byStatus = groupCount(cases, (c) => caseStatusLabel[c.status])
  const byNotice = groupCount(cases, (c) => noticeStatusLabel[c.noticeStatus])
  const totalAmount = cases.reduce((s, c) => s + (c.amount ?? 0), 0)

  const exportAll = () => {
    const rows: (string | number)[][] = [['التصنيف', 'العنصر', 'عدد الملفات']]
    for (const [title, g] of [
      ['نوع القضية', byType],
      ['المحكمة', byCourt],
      ['المدينة', byCity],
      ['الحالة', byStatus],
      ['الإشعار', byNotice],
    ] as const)
      for (const [k, v] of g) rows.push([title, k, v])
    downloadFile('تقرير-القضايا.csv', toCsv(rows))
  }

  return (
    <>
      <PageHeader
        title="التقارير"
        subtitle="إحصائيات شاملة لملفات المكتب"
        actions={
          <>
            <AppButton variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" aria-hidden />
              طباعة
            </AppButton>
            <AppButton variant="gold" onClick={exportAll}>
              <Download className="size-4" aria-hidden />
              تصدير التقرير
            </AppButton>
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="مجموع الملفات" value={formatNumber(cases.length)} />
        <Stat label="مجموع المواعيد" value={formatNumber(state.sessions.length)} />
        <Stat label="مجموع المبالغ المطالب بها" value={formatMAD(totalAmount)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Breakdown title="حسب نوع القضية" data={byType} total={cases.length} />
        <Breakdown title="حسب الحالة" data={byStatus} total={cases.length} />
        <Breakdown title="حسب المحكمة" data={byCourt} total={cases.length} />
        <Breakdown title="حسب المدينة" data={byCity} total={cases.length} />
        <Breakdown title="حسب حالة الإشعار" data={byNotice} total={cases.length} />
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-3xl font-extrabold text-navy">{value}</p>
    </Card>
  )
}

function Breakdown({ title, data, total }: { title: string; data: [string, number][]; total: number }) {
  return (
    <Card>
      <h2 className="border-b border-border px-5 py-4 font-bold">{title}</h2>
      <ul className="flex flex-col gap-3 p-5">
        {data.map(([k, v]) => (
          <li key={k}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="truncate font-semibold">{k}</span>
              <span className="font-bold">
                {v} <span className="text-xs text-muted-foreground">({Math.round((v / (total || 1)) * 100)}%)</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gold" style={{ width: `${(v / (total || 1)) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
