'use client'

import { useMemo, useState, useEffect } from 'react'
import { ArrowDownUp, ChevronDown, ChevronUp, Download, FolderSearch, Plus, Search, SlidersHorizontal, Trash2, Archive } from 'lucide-react'
import { PageHeader } from '@/components/shell/page-header'
import { AppButton } from '@/components/ui-kit/app-button'
import { CaseStatusBadge, NoticeBadge } from '@/components/ui-kit/badges'
import { useConfirm } from '@/components/feedback/confirm-provider'
import { CaseDetail } from './case-detail'
import { nextSessionFor, useStore } from '@/lib/store'
import { caseStatusLabel, downloadFile, formatDate, lineage, normalizeArabic, noticeStatusLabel, ownerName, toCsv } from '@/lib/format'
import type { CaseFile, CaseStatus, NoticeStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 12
const tabs: { key: 'all' | CaseStatus; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'جارية' },
  { key: 'postponed', label: 'مؤجلة' },
  { key: 'judged', label: 'محكومة' },
  { key: 'appealed', label: 'مستأنفة' },
  { key: 'archived', label: 'مؤرشفة' },
]

type SortKey = 'ref' | 'owner' | 'caseDate' | 'type' | 'notice' | 'status'

export function CasesView() {
  const { state, actions, ui } = useStore()
  const confirm = useConfirm()

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const [tab, setTab] = useState<'all' | CaseStatus>('all')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [noticeFilter, setNoticeFilter] = useState<'' | NoticeStatus>('')
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'caseDate', dir: -1 })
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  // استدعاء جميع الـ useMemo في البداية لتجنب مخالفة قواعد الـ Hooks
  const filtered = useMemo(() => {
    const q = normalizeArabic(query)
    const list = state.cases.filter((c) => {
      if (tab === 'all' ? c.status === 'archived' : c.status !== tab) return false
      if (typeFilter && c.type !== typeFilter) return false
      if (cityFilter && c.city !== cityFilter) return false
      if (noticeFilter && c.noticeStatus !== noticeFilter) return false
      if (!q) return true
      const hay = normalizeArabic(
        [ownerName(c), c.familyName, lineage(c), c.ref, c.courtRef, c.phone, c.phone.replace(/\D/g, ''), c.cin, c.opponent, c.notes].join(' '),
      )
      return q.split(' ').every((part) => hay.includes(part))
    })
    const value = (c: CaseFile): string => {
      switch (sort.key) {
        case 'ref':
          return c.ref
        case 'owner':
          return ownerName(c)
        case 'type':
          return c.type
        case 'notice':
          return c.noticeStatus
        case 'status':
          return c.status
        default:
          return c.caseDate
      }
    }
    return [...list].sort((a, b) => value(a).localeCompare(value(b), 'ar') * sort.dir)
  }, [state.cases, tab, query, typeFilter, cityFilter, noticeFilter, sort])

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: 0 }
    for (const c of state.cases) {
      m[c.status] = (m[c.status] ?? 0) + 1
      if (c.status !== 'archived') m.all++
    }
    return m
  }, [state.cases])

  // التحقق من الـ mounted بعد استدعاء جميع الـ Hooks حصرياً
  if (!mounted) {
    return null
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const selected = state.cases.find((c) => c.id === selectedId) ?? null
  const checkedIds = [...checked].filter((id) => state.cases.some((c) => c.id === id))
  const allOnPageChecked = rows.length > 0 && rows.every((r) => checked.has(r.id))

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }))
  const resetPage = () => setPage(1)

  const exportList = (list: CaseFile[]) => {
    const rowsCsv: (string | number)[][] = [
      ['رقم الملف', 'رقم المحكمة', 'صاحب القضية', 'النسب', 'تاريخ القضية', 'نوع القضية', 'المحكمة', 'المدينة', 'الإشعار', 'الحالة'],
      ...list.map((c) => [c.ref, c.courtRef, ownerName(c), lineage(c), formatDate(c.caseDate), c.type, c.court, c.city, noticeStatusLabel[c.noticeStatus], caseStatusLabel[c.status]]),
    ]
    downloadFile('ملفات-القضايا.csv', toCsv(rowsCsv))
  }

  const bulkDelete = async () => {
    const ok = await confirm({
      title: `حذف ${checkedIds.length} ملفات`,
      tone: 'danger',
      description: `سيتم نقل ${checkedIds.length} ملفات محددة إلى سلة المحذوفات. يمكنك التراجع خلال 8 ثوان أو استرجاعها لاحقا من السلة.`,
      confirmLabel: 'حذف المحدد',
    })
    if (!ok) return
    actions.deleteCases(checkedIds)
    if (selectedId && checkedIds.includes(selectedId)) setSelectedId(null)
    setChecked(new Set())
  }

  const bulkStatus = async (status: CaseStatus) => {
    const ok = await confirm({
      title: 'تغيير حالة الملفات',
      description: `سيتم تغيير حالة ${checkedIds.length} ملفات إلى "${caseStatusLabel[status]}".`,
      confirmLabel: 'تأكيد',
    })
    if (!ok) return
    actions.setCasesStatus(checkedIds, status)
    setChecked(new Set())
  }

  return (
    <>
      <PageHeader
        title="ملفات القضايا"
        subtitle="جميع الملفات المسجلة في النظام"
        actions={
          <>
            <div className="relative w-full md:w-96">
              <Search className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-4 text-muted-foreground" aria-hidden />
              <label htmlFor="case-search" className="sr-only">
                بحث في الملفات
              </label>
              <input
                id="case-search"
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  resetPage()
                }}
                placeholder="ابحث باسم صاحب القضية أو رقم الملف أو النسب أو الهاتف"
                className="h-12 w-full rounded-xl border border-border bg-card ps-10 pe-4 text-sm outline-none transition focus:border-gold focus:ring-3 focus:ring-gold/20"
              />
            </div>
            <AppButton variant="gold" className="h-12" onClick={() => ui.openCaseForm()}>
              <Plus className="size-4" aria-hidden />
              إضافة ملف جديد
            </AppButton>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="no-print flex min-w-0 flex-col rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">قائمة الملفات</h2>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{filtered.length} ملفا معروضا</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div role="tablist" aria-label="تصفية حسب الحالة" className="flex flex-wrap gap-1.5">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    role="tab"
                    type="button"
                    aria-selected={tab === t.key}
                    onClick={() => {
                      setTab(t.key)
                      resetPage()
                    }}
                    className={cn(
                      'rounded-lg px-3.5 py-2 text-sm font-semibold transition',
                      tab === t.key ? 'bg-navy text-white shadow' : 'bg-muted text-muted-foreground hover:bg-border hover:text-foreground',
                    )}
                  >
                    {t.label}
                    <span className="ms-1.5 text-xs opacity-70">{counts[t.key] ?? 0}</span>
                  </button>
                ))}
              </div>
              <AppButton variant={showFilters ? 'primary' : 'outline'} size="sm" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
                <SlidersHorizontal className="size-4" aria-hidden />
                فلاتر
              </AppButton>
              <AppButton variant="outline" size="sm" onClick={() => exportList(filtered)}>
                <Download className="size-4" aria-hidden />
                تصدير
              </AppButton>
            </div>
          </div>

          {showFilters && (
            <div className="grid gap-3 border-b border-border bg-muted/40 px-5 py-4 sm:grid-cols-4">
              <FilterSelect label="نوع القضية" value={typeFilter} onChange={(v) => (setTypeFilter(v), resetPage())} options={state.caseTypes} />
              <FilterSelect label="المدينة" value={cityFilter} onChange={(v) => (setCityFilter(v), resetPage())} options={state.cities} />
              <FilterSelect
                label="حالة الإشعار"
                value={noticeFilter}
                onChange={(v) => (setNoticeFilter(v as NoticeStatus | ''), resetPage())}
                options={Object.keys(noticeStatusLabel)}
                labels={noticeStatusLabel}
              />
              <div className="flex items-end">
                <AppButton
                  variant="ghost"
                  size="sm"
                  className="h-10 w-full"
                  onClick={() => {
                    setTypeFilter('')
                    setCityFilter('')
                    setNoticeFilter('')
                    setQuery('')
                    resetPage()
                  }}
                >
                  مسح الفلاتر
                </AppButton>
              </div>
            </div>
          )}

          {checkedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-gold/30 bg-gold-soft px-5 py-3 animate-in fade-in-0">
              <span className="text-sm font-bold">{checkedIds.length} محدد</span>
              <span className="flex-1" />
              <label className="sr-only" htmlFor="bulk-status">
                تغيير الحالة
              </label>
              <select
                id="bulk-status"
                value=""
                onChange={(e) => e.target.value && void bulkStatus(e.target.value as CaseStatus)}
                className="h-9 rounded-lg border border-border bg-card px-2 text-xs font-semibold"
              >
                <option value="">تغيير الحالة...</option>
                {(Object.keys(caseStatusLabel) as CaseStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {caseStatusLabel[s]}
                  </option>
                ))}
              </select>
              <AppButton size="sm" variant="outline" onClick={() => void bulkStatus('archived')}>
                <Archive className="size-4" aria-hidden />
                أرشفة
              </AppButton>
              <AppButton size="sm" variant="outline" onClick={() => exportList(state.cases.filter((c) => checked.has(c.id)))}>
                <Download className="size-4" aria-hidden />
                تصدير
              </AppButton>
              <AppButton size="sm" variant="danger" onClick={() => void bulkDelete()}>
                <Trash2 className="size-4" aria-hidden />
                حذف المحدد
              </AppButton>
              <AppButton size="sm" variant="ghost" onClick={() => setChecked(new Set())}>
                إلغاء التحديد
              </AppButton>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th scope="col" className="w-12 px-5 py-3 text-start">
                    <input
                      type="checkbox"
                      aria-label="تحديد كل ملفات الصفحة"
                      checked={allOnPageChecked}
                      onChange={() =>
                        setChecked((prev) => {
                          const next = new Set(prev)
                          rows.forEach((r) => (allOnPageChecked ? next.delete(r.id) : next.add(r.id)))
                          return next
                        })
                      }
                      className="size-4 accent-[#c99a3b]"
                    />
                  </th>
                  <SortHeader label="رقم الملف" k="ref" sort={sort} onSort={toggleSort} />
                  <SortHeader label="صاحب القضية" k="owner" sort={sort} onSort={toggleSort} />
                  <th scope="col" className="px-3 py-3 text-start font-semibold">
                    النسب
                  </th>
                  <SortHeader label="تاريخ القضية" k="caseDate" sort={sort} onSort={toggleSort} />
                  <SortHeader label="نوع القضية" k="type" sort={sort} onSort={toggleSort} />
                  <SortHeader label="الإشعار" k="notice" sort={sort} onSort={toggleSort} />
                  <SortHeader label="الحالة" k="status" sort={sort} onSort={toggleSort} />
                  <th scope="col" className="px-3 py-3 text-start font-semibold">
                    الجلسة المقبلة
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => {
                  const next = nextSessionFor(state.sessions, c.id)
                  const isSelected = c.id === selectedId
                  return (
                    <tr
                      key={c.id}
                      tabIndex={0}
                      aria-selected={isSelected}
                      onClick={() => setSelectedId(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedId(c.id)
                        }
                        if (e.key === 'ArrowDown') (e.currentTarget.nextElementSibling as HTMLElement | null)?.focus()
                        if (e.key === 'ArrowUp') (e.currentTarget.previousElementSibling as HTMLElement | null)?.focus()
                      }}
                      style={{ animationDelay: `${i * 25}ms` }}
                      className={cn(
                        'cursor-pointer border-b border-border/70 outline-none transition animate-in fade-in-0 fill-mode-both last:border-0 focus-visible:bg-muted',
                        isSelected ? 'bg-gold-soft shadow-[inset_-4px_0_0_var(--gold)]' : 'hover:bg-muted/60',
                      )}
                    >
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`تحديد الملف ${c.ref}`}
                          checked={checked.has(c.id)}
                          onChange={() =>
                            setChecked((prev) => {
                              const next = new Set(prev)
                              if (next.has(c.id)) next.delete(c.id)
                              else next.add(c.id)
                              return next
                            })
                          }
                          className="size-4 accent-[#c99a3b]"
                        />
                      </td>
                      <td className="px-3 py-4 font-bold whitespace-nowrap">{c.ref}</td>
                      <td className="px-3 py-4 font-bold">{ownerName(c)}</td>
                      <td className="px-3 py-4 text-muted-foreground">{lineage(c)}</td>
                      <td className="px-3 py-4 whitespace-nowrap">{formatDate(c.caseDate)}</td>
                      <td className="px-3 py-4">{c.type}</td>
                      <td className="px-3 py-4">
                        <NoticeBadge status={c.noticeStatus} />
                      </td>
                      <td className="px-3 py-4">
                        <CaseStatusBadge status={c.status} />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-muted-foreground">{next ? formatDate(next.date) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
                  <FolderSearch className="size-6" aria-hidden />
                </span>
                <p className="font-bold">لا توجد ملفات مطابقة</p>
                <p className="text-sm text-muted-foreground">جرب تعديل كلمات البحث أو الفلاتر، أو أضف ملفا جديدا.</p>
                <AppButton variant="gold" onClick={() => ui.openCaseForm()}>
                  <Plus className="size-4" aria-hidden />
                  إضافة ملف جديد
                </AppButton>
              </div>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
            <p className="text-sm text-muted-foreground">
              عرض {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} إلى {Math.min(currentPage * PAGE_SIZE, filtered.length)} من {filtered.length} ملفا
            </p>
            <nav aria-label="ترقيم الصفحات" className="flex gap-1.5">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  aria-current={p === currentPage ? 'page' : undefined}
                  className={cn(
                    'grid size-9 place-items-center rounded-lg text-sm font-bold transition',
                    p === currentPage ? 'bg-navy text-white' : 'bg-muted text-muted-foreground hover:bg-border',
                  )}
                >
                  {p}
                </button>
              ))}
            </nav>
          </div>
        </section>

        {selected && (
          <>
            <div className="hidden xl:sticky xl:top-8 xl:block xl:h-[calc(100dvh-8rem)]">
              <CaseDetail c={selected} />
            </div>
            <div className="fixed inset-0 z-40 flex justify-end xl:hidden">
              <button type="button" aria-label="إغلاق التفاصيل" className="no-print absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
              <div className="relative h-full w-full max-w-md p-3 animate-in slide-in-from-left">
                <CaseDetail c={selected} onClose={() => setSelectedId(null)} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function SortHeader({ label, k, sort, onSort }: { label: string; k: SortKey; sort: { key: SortKey; dir: 1 | -1 }; onSort: (k: SortKey) => void }) {
  const active = sort.key === k
  const Icon = !active ? ArrowDownUp : sort.dir === 1 ? ChevronUp : ChevronDown
  return (
    <th scope="col" aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className="px-3 py-3 text-start font-semibold">
      <button type="button" onClick={() => onSort(k)} className={cn('inline-flex items-center gap-1 hover:text-foreground', active && 'text-navy')}>
        {label}
        <Icon className="size-3.5" aria-hidden />
      </button>
    </th>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  labels?: Record<string, string>
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-lg border border-border bg-card px-2 text-sm text-foreground">
        <option value="">الكل</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  )
}