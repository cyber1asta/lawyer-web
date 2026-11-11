import type { CaseFile, CaseStatus, NoticeStatus, SessionKind, SessionStatus } from './types'

export const pad = (n: number) => String(n).padStart(2, '0')

export function toLatinDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
}

export function formatDate(iso?: string | null) {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function parseDisplayDate(value: string): string | null {
  const match = toLatinDigits(value).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  const [, d, m, y] = match
  const day = Number(d)
  const month = Number(m)
  const year = Number(y)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return `${year}-${pad(month)}-${pad(day)}`
}

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function daysBetween(fromIso: string, toIso: string) {
  const a = Date.UTC(...(fromIso.split('-').map(Number) as [number, number, number]))
  const b = Date.UTC(...(toIso.split('-').map(Number) as [number, number, number]))
  return Math.round((b - a) / 86400000)
}

export function formatNumber(n: number) {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function formatMAD(n: number | null | undefined) {
  if (n == null) return '—'
  return `${formatNumber(n)} درهم`
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('212') && digits.length === 12) {
    const rest = digits.slice(3)
    return `+212 ${rest[0]} ${rest.slice(1).replace(/(\d{2})(?=\d)/g, '$1 ')}`
  }
  if (digits.length === 10) return digits.replace(/(\d{2})(?=\d)/g, '$1 ')
  return phone || '—'
}

export function isValidPhone(phone: string) {
  const digits = toLatinDigits(phone).replace(/[\s.-]/g, '').replace(/^\+/, '')
  return /^0[5-7]\d{8}$/.test(digits) || /^212[5-7]\d{8}$/.test(digits)
}

export function isValidCin(cin: string) {
  return /^[A-Z]{1,2}\d{4,6}$/i.test(cin.trim())
}

export function normalizeArabic(value: string) {
  return toLatinDigits(value)
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
}

export function ownerName(c: Pick<CaseFile, 'firstName' | 'familyName' | 'gender' | 'fatherName'>) {
  return `${c.firstName} ${c.gender === 'f' ? 'بنت' : 'بن'} ${c.fatherName} ${c.familyName}`
}

export function lineage(c: Pick<CaseFile, 'gender' | 'fatherName' | 'motherName'>) {
  return `${c.gender === 'f' ? 'بنت' : 'ابن'} ${c.fatherName} و${c.motherName}`
}

export const caseStatusLabel: Record<CaseStatus, string> = {
  active: 'جارية',
  postponed: 'مؤجلة',
  judged: 'محكومة',
  appealed: 'مستأنفة',
  archived: 'مؤرشفة',
}

export const noticeStatusLabel: Record<NoticeStatus, string> = {
  received: 'تم التوصل',
  pending: 'في الانتظار',
  not_received: 'لم يتم التوصل',
}

export const sessionKindLabel: Record<SessionKind, string> = {
  hearing: 'جلسة',
  consultation: 'استشارة',
  client: 'لقاء موكل',
  deadline: 'أجل قانوني',
}

export const sessionStatusLabel: Record<SessionStatus, string> = {
  scheduled: 'مبرمجة',
  done: 'منجزة',
  postponed: 'مؤجلة',
  cancelled: 'ملغاة',
}

export const arabicMonths = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'ماي',
  'يونيو',
  'يوليوز',
  'غشت',
  'شتنبر',
  'أكتوبر',
  'نونبر',
  'دجنبر',
]

export const arabicWeekdays = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\uFEFF' + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function toCsv(rows: (string | number)[][]) {
  return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
}
