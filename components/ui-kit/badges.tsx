import { cn } from '@/lib/utils'
import { caseStatusLabel, noticeStatusLabel, sessionStatusLabel } from '@/lib/format'
import type { CaseStatus, NoticeStatus, SessionStatus } from '@/lib/types'

const pill = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap'

const caseColors: Record<CaseStatus, string> = {
  active: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  postponed: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  judged: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  appealed: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
  archived: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
}

const noticeColors: Record<NoticeStatus, string> = {
  received: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  not_received: 'bg-red-50 text-red-700 ring-1 ring-red-100',
}

const sessionColors: Record<SessionStatus, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  done: 'bg-emerald-50 text-emerald-700',
  postponed: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-slate-100 text-slate-500 line-through',
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return <span className={cn(pill, caseColors[status])}>{caseStatusLabel[status]}</span>
}

export function NoticeBadge({ status }: { status: NoticeStatus }) {
  return <span className={cn(pill, noticeColors[status])}>{noticeStatusLabel[status]}</span>
}

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  return <span className={cn(pill, sessionColors[status])}>{sessionStatusLabel[status]}</span>
}
