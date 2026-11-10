'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useToast } from '@/components/feedback/toast-provider'
import { caseStatusLabel, ownerName, todayISO, uid } from './format'
import {
  seedCasesData,
  seedCaseTypes,
  seedCities,
  seedCourts,
  seedNoticeMethods,
  seedNotificationsData,
  seedOffice,
  seedSessionsData,
} from './seed'
import type {
  AppNotification,
  CaseFile,
  CaseInput,
  CaseStatus,
  Court,
  ListKey,
  OfficeProfile,
  Session,
  SessionInput,
  SessionStatus,
  TrashItem,
} from './types'

// 📱 دالة إرسال الإشعارات المفصلة والاحترافية إلى تطبيق الواتساب عبر الخادم المحلي
function sendWhatsAppAlert(text: string) {
  try {
    const phone = '212699546412' // رقم هاتفك بالصيغة الدولية المغربية
    fetch('http://localhost:3001/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message: text }),
    }).catch((err) => {
      console.warn('WhatsApp server is offline:', err.message)
    })
  } catch (e) {
    console.error('WhatsApp dispatch failed', e)
  }
}

export interface AppState {
  cases: CaseFile[]
  sessions: Session[]
  notifications: AppNotification[]
  trash: TrashItem[]
  courts: Court[]
  cities: string[]
  caseTypes: string[]
  noticeMethods: string[]
  office: OfficeProfile
}

const STORAGE_KEY = 'law_office_app_state_v1'

function getInitialState(): AppState {
  if (typeof window === 'undefined') {
    return {
      cases: seedCasesData,
      sessions: seedSessionsData,
      notifications: seedNotificationsData,
      trash: [],
      courts: seedCourts,
      cities: seedCities,
      caseTypes: seedCaseTypes,
      noticeMethods: seedNoticeMethods,
      office: seedOffice,
    }
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e)
  }
  return {
    cases: seedCasesData,
    sessions: seedSessionsData,
    notifications: seedNotificationsData,
    trash: [],
    courts: seedCourts,
    cities: seedCities,
    caseTypes: seedCaseTypes,
    noticeMethods: seedNoticeMethods,
    office: seedOffice,
  }
}

type Updater = (s: AppState) => AppState

function notify(s: AppState, title: string, body: string, caseId: string | null = null, detailedMsg?: string): AppState {
  // إرسال تنبيه احترافي ومفصل إلى الواتساب
  const waText = detailedMsg || `⚖️ *مكتب الأستاذة حسناء - إشعار رسمي*\n\n📌 *${title}*\n${body}\n\n🕒 *التاريخ:* ${todayISO()}`
  sendWhatsAppAlert(waText)

  return {
    ...s,
    notifications: [{ id: uid('n'), title, body, date: todayISO(), read: false, caseId }, ...s.notifications],
  }
}

function nextRef(cases: CaseFile[]) {
  const year = new Date().getFullYear()
  const max = cases.reduce((m, c) => {
    const parts = c.ref.split('-')
    const n = Number(parts[2] || 0)
    return c.ref.includes(`-${year}-`) && n > m ? n : m
  }, 0)
  return `ق-${year}-${String(max + 1).padStart(4, '0')}`
}

type CaseFormState = { open: boolean; editing: CaseFile | null }
type SessionFormState = { open: boolean; editing: Session | null; presetDate?: string; presetCaseId?: string }

function useStoreValue() {
  const [state, setState] = useState<AppState>(getInitialState)
  const ref = useRef(state)
  const toast = useToast()
  const [caseForm, setCaseForm] = useState<CaseFormState>({ open: false, editing: null })
  const [sessionForm, setSessionForm] = useState<SessionFormState>({ open: false, editing: null })

  useEffect(() => {
    ref.current = state
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.error('Failed to save state to localStorage', e)
    }
  }, [state])

  const commit = useCallback(
    (message: string, updater: Updater) => {
      const snapshot = ref.current
      const next = updater(snapshot)
      ref.current = next
      setState(next)
      toast.show({
        message,
        onUndo: () => {
          ref.current = snapshot
          setState(snapshot)
          toast.show({ message: 'تم التراجع عن العملية بنجاح' })
        },
      })
    },
    [toast],
  )

  const actions = useMemo(
    () => ({
      saveCase(input: CaseInput, id?: string) {
        let createdId = id ?? ''
        if (id) {
          commit('تم حفظ تعديلات الملف', (s) => {
            const updated = s.cases.map((c) => (c.id === id ? { ...c, ...input } : c))
            const c = updated.find((x) => x.id === id)!
            const detailed = `📂 *تعديل بيانات ملف قضائي*\n\n` +
                             `🔹 *رقم الملف:* ${c.ref}\n` +
                             `👤 *الأطراف:* ${ownerName(c)}\n` +
                             `🏛️ *المحكمة:* ${c.court || 'غير محددة'}\n` +
                             `🏷️ *نوع القضية:* ${c.type || 'غير محدد'}\n` +
                             `📌 *الحالة:* ${caseStatusLabel[c.status] || c.status}\n` +
                             `📅 *تاريخ التعديل:* ${todayISO()}`
            return notify({ ...s, cases: updated }, 'تعديل ملف', `تم تعديل الملف ${c.ref}\n${ownerName(c)}`, id, detailed)
          })
        } else {
          createdId = uid('case')
          commit('تمت إضافة الملف بنجاح', (s) => {
            const c: CaseFile = { ...input, id: createdId, ref: nextRef(s.cases), createdAt: todayISO() }
            const detailed = `📂 *فتح ملف قضائي جديد*\n\n` +
                             `🔹 *رقم الملف:* ${c.ref}\n` +
                             `👤 *الأطراف / الموكل:* ${ownerName(c)}\n` +
                             `🏛️ *المحكمة:* ${c.court || 'غير محددة'}\n` +
                             `🏷️ *نوع القضية:* ${c.type || 'غير محدد'}\n` +
                             `🏙️ *المدينة:* ${c.city || 'غير محددة'}\n` +
                             `📅 *تاريخ الفتح:* ${c.createdAt}`
            return notify({ ...s, cases: [c, ...s.cases] }, 'ملف جديد', `تم فتح الملف ${c.ref}\n${ownerName(c)}`, c.id, detailed)
          })
        }
        return createdId
      },
      deleteCases(ids: string[]) {
        commit(ids.length > 1 ? `تم نقل ${ids.length} ملفات إلى سلة المحذوفات` : 'تم نقل الملف إلى سلة المحذوفات', (s) => {
          const removed = s.cases.filter((c) => ids.includes(c.id))
          const now = todayISO()
          
          const caseDetailsList = removed.map(c => `   • ${c.ref} (${ownerName(c)})`).join('\n')
          sendWhatsAppAlert(
            `🗑️ *تنبيه نقل ملفات إلى سلة المحذوفات*\n\n` +
            ` عدد الملفات المحذوفة: *${ids.length}*\n` +
            ` تفاصيل الملفات:\n${caseDetailsList}\n\n` +
            `🕒 *التاريخ:* ${now}`
          )

          return {
            ...s,
            cases: s.cases.filter((c) => !ids.includes(c.id)),
            trash: [...removed.map((item) => ({ id: uid('t'), kind: 'case' as const, deletedAt: now, item })), ...s.trash],
          }
        })
      },
      setCasesStatus(ids: string[], status: CaseStatus) {
        commit(
          status === 'archived' ? `تمت أرشفة ${ids.length > 1 ? `${ids.length} ملفات` : 'الملف'}` : `تم تغيير الحالة إلى "${caseStatusLabel[status]}"`,
          (s) => {
            const detailed = `🔄 *تغيير حالة ملفات القضية*\n\n` +
                             `📌 *الحالة الجديدة:* ${caseStatusLabel[status]}\n` +
                             `🔢 *عدد الملفات المحدثة:* ${ids.length}\n` +
                             `🕒 *التاريخ:* ${todayISO()}`
            return notify(
              { ...s, cases: s.cases.map((c) => (ids.includes(c.id) ? { ...c, status } : c)) },
              'تغيير الحالة',
              `تم تغيير حالة ${ids.length} ملف إلى ${caseStatusLabel[status]}`,
              ids.length === 1 ? ids[0] : null,
              detailed,
            )
          },
        )
      },
      saveSession(input: SessionInput, id?: string) {
        commit(id ? 'تم حفظ تعديلات الموعد' : 'تمت إضافة الموعد بنجاح', (s) => {
          const sessions = id
            ? s.sessions.map((x) => (x.id === id ? { ...x, ...input } : x))
            : [...s.sessions, { ...input, id: uid('session') }]
          
          const actionTitle = id ? 'تعديل موعد / جلسة' : 'موعد / جلسة جديدة'
          const detailed = `📅 *${actionTitle}*\n\n` +
                           `📌 *العنوان / الموضوع:* ${input.title}\n` +
                           `📆 *التاريخ:* ${input.date.split('-').reverse().join('/')}\n` +
                           `⏰ *التوقيت:* ${input.time}\n` +
                           `🏛️ *المحكمة / المكان:* ${input.court || 'غير محدد'}\n` +
                           `📝 *ملاحظات:* ${input.note || 'لا توجد ملاحظات'}\n` +
                           `🕒 *تاريخ التحديث:* ${todayISO()}`

          return notify({ ...s, sessions }, actionTitle, `${input.title} بتاريخ ${input.date.split('-').reverse().join('/')} على الساعة ${input.time}`, input.caseId, detailed)
        })
      },
      postponeSession(id: string, date: string, time: string, reason: string) {
        commit('تم تأجيل الموعد', (s) => {
          const old = s.sessions.find((x) => x.id === id)
          if (!old) return s
          const sessions = s.sessions.map((x) => (x.id === id ? { ...x, status: 'postponed' as SessionStatus, note: reason } : x))
          sessions.push({ ...old, id: uid('session'), date, time, status: 'scheduled', note: `مؤجلة من ${old.date.split('-').reverse().join('/')}\n${reason}` })
          const cases = old.caseId ? s.cases.map((c) => (c.id === old.caseId && c.status === 'active' ? { ...c, status: 'postponed' as CaseStatus } : c)) : s.cases
          
          const detailed = `⏳ *تأجيل جلسة / موعد قضائي*\n\n` +
                           `📌 *العنوان:* ${old.title}\n` +
                           `📅 *الموعد السابق:* ${old.date.split('-').reverse().join('/')} على الساعة ${old.time}\n` +
                           `📆 *الموعد الجديد:* ${date.split('-').reverse().join('/')} على الساعة ${time}\n` +
                           `💬 *سبب التأجيل:* ${reason}\n` +
                           `🕒 *التاريخ:* ${todayISO()}`

          return notify({ ...s, sessions, cases }, 'تأجيل جلسة', `أُجّل "${old.title}" إلى ${date.split('-').reverse().join('/')}\nالسبب: ${reason}`, old.caseId, detailed)
        })
      },
      setSessionStatus(id: string, status: SessionStatus) {
        commit(status === 'done' ? 'تم تعليم الموعد كمنجز' : status === 'cancelled' ? 'تم إلغاء الموعد' : 'تم تحديث الموعد', (s) => {
          const session = s.sessions.find(x => x.id === id)
          const statusText = status === 'done' ? 'منجز ✅' : status === 'cancelled' ? 'ملغي ❌' : status
          const detailed = `🔔 *تحديث حالة موعد*\n\n` +
                           `📌 *العنوان:* ${session?.title || 'موعد'}\n` +
                           `📊 *الحالة الجديدة:* ${statusText}\n` +
                           `🕒 *التاريخ:* ${todayISO()}`
          sendWhatsAppAlert(detailed)
          return {
            ...s,
            sessions: s.sessions.map((x) => (x.id === id ? { ...x, status } : x)),
          }
        })
      },
      deleteSession(id: string) {
        commit('تم نقل الموعد إلى سلة المحذوفات', (s) => {
          const item = s.sessions.find((x) => x.id === id)
          if (!item) return s
          
          const detailed = `🗑️ *حذف موعد ونقله للسلة*\n\n` +
                           `📌 *عنوان الموعد:* ${item.title}\n` +
                           `📆 *التاريخ:* ${item.date?.split('-').reverse().join('/')}\n` +
                           `⏰ *التوقيت:* ${item.time}\n` +
                           `🕒 *تاريخ الحذف:* ${todayISO()}`
          sendWhatsAppAlert(detailed)

          return {
            ...s,
            sessions: s.sessions.filter((x) => x.id !== id),
            trash: [{ id: uid('t'), kind: 'session', deletedAt: todayISO(), item }, ...s.trash],
          }
        })
      },
      restoreTrash(ids: string[]) {
        commit(ids.length > 1 ? 'تم استرجاع العناصر' : 'تم استرجاع العنصر', (s) => {
          const items = s.trash.filter((t) => ids.includes(t.id))
          
          const detailed = `♻️ *استرجاع عناصر من سلة المحذوفات*\n\n` +
                           `🔢 *عدد العناصر المسترجعة:* ${ids.length}\n` +
                           `🕒 *التاريخ:* ${todayISO()}`
          sendWhatsAppAlert(detailed)

          return {
            ...s,
            trash: s.trash.filter((t) => !ids.includes(t.id)),
            cases: [...items.flatMap((t) => (t.kind === 'case' ? [t.item] : [])), ...s.cases],
            sessions: [...s.sessions, ...items.flatMap((t) => (t.kind === 'session' ? [t.item] : []))],
          }
        })
      },
      purgeTrash(ids: string[]) {
        commit('تم الحذف النهائي', (s) => {
          const detailed = `⚠️ *حذف نهائي (إفراغ من السلة)*\n\n` +
                           `🔢 *عدد العناصر المحذوفة نهائياً:* ${ids.length}\n` +
                           `🕒 *التاريخ:* ${todayISO()}`
          sendWhatsAppAlert(detailed)
          return { ...s, trash: s.trash.filter((t) => !ids.includes(t.id)) }
        })
      },
      markNotifications(ids: string[], read: boolean) {
        commit(read ? 'تم تعليم الإشعارات كمقروءة' : 'تم تعليم الإشعار كغير مقروء', (s) => ({
          ...s,
          notifications: s.notifications.map((n) => (ids.includes(n.id) ? { ...n, read } : n)),
        }))
      },
      deleteNotifications(ids: string[]) {
        commit(ids.length > 1 ? 'تم حذف الإشعارات' : 'تم حذف الإشعار', (s) => ({
          ...s,
          notifications: s.notifications.filter((n) => !ids.includes(n.id)),
        }))
      },
      saveCourt(court: Omit<Court, 'id'>, id?: string) {
        commit(id ? 'تم تعديل المحكمة' : 'تمت إضافة المحكمة', (s) => {
          const detailed = `🏛️ *إدارة المحاكم*\n\n` +
                           `📌 *اسم المحكمة:* ${court.name}\n` +
                           `🏙️ *المدينة:* ${court.city}\n` +
                           `🕒 *التاريخ:* ${todayISO()}`
          sendWhatsAppAlert(detailed)
          return {
            ...s,
            courts: id ? s.courts.map((c) => (c.id === id ? { ...c, ...court } : c)) : [...s.courts, { ...court, id: uid('court') }],
          }
        })
      },
      deleteCourt(id: string) {
        commit('تم حذف المحكمة من القائمة', (s) => {
          const court = s.courts.find(c => c.id === id)
          const detailed = `🏛️ *حذف محكمة*\n\n` +
                           `📌 *اسم المحكمة:* ${court?.name || id}\n` +
                           `🕒 *التاريخ:* ${todayISO()}`
          sendWhatsAppAlert(detailed)
          return { ...s, courts: s.courts.filter((c) => c.id !== id) }
        })
      },
      saveListItem(list: ListKey, value: string, oldValue?: string) {
        commit(oldValue ? 'تم تعديل العنصر' : 'تمت إضافة العنصر', (s) => {
          const detailed = `📋 *تحديث القوائم الإدارية (${list})*\n\n` +
                           `🔹 *القيمة الجديدة:* ${value}\n` +
                           (oldValue ? `🔸 *القيمة السابقة:* ${oldValue}\n` : '') +
                           `🕒 *التاريخ:* ${todayISO()}`
          sendWhatsAppAlert(detailed)
          return {
            ...s,
            [list]: oldValue ? s[list].map((v) => (v === oldValue ? value : v)) : [...s[list], value],
          }
        })
      },
      deleteListItem(list: ListKey, value: string) {
        commit('تم حذف العنصر من القائمة', (s) => {
          const detailed = `📋 *حذف عنصر من القائمة (${list})*\n\n` +
                           `❌ *العنصر المحذوف:* ${value}\n` +
                           `🕒 *التاريخ:* ${todayISO()}`
          sendWhatsAppAlert(detailed)
          return { ...s, [list]: s[list].filter((v) => v !== value) }
        })
      },
saveOffice(office: OfficeProfile) {
        commit('تم حفظ معلومات المكتب', (s) => {
          const detailed = `⚖️ *تحديث معلومات المكتب*\n\n` +
                           `📌 *اسم الأستاذ(ة):* ${office.lawyerName}\n` +
                           `📞 *الهاتف:* ${office.phone}\n` +
                           `🏙️ *المدينة:* ${office.city}\n` +
                           `🕒 *التاريخ:* ${todayISO()}`
          sendWhatsAppAlert(detailed)
          return { ...s, office }
        })
      },
    }),
    [commit],
  )

  const ui = useMemo(
    () => ({
      caseForm,
      openCaseForm: (editing: CaseFile | null = null) => setCaseForm({ open: true, editing }),
      closeCaseForm: () => setCaseForm({ open: false, editing: null }),
      sessionForm,
      openSessionForm: (editing: Session | null = null, preset?: { date?: string; caseId?: string }) =>
        setSessionForm({ open: true, editing, presetDate: preset?.date, presetCaseId: preset?.caseId }),
      closeSessionForm: () => setSessionForm({ open: false, editing: null }),
    }),
    [caseForm, sessionForm],
  )

  return { state, actions, ui }
}

type StoreValue = ReturnType<typeof useStoreValue>
const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue()
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

export function nextSessionFor(sessions: Session[], caseId: string, today = todayISO()) {
  return sessions
    .filter((s) => s.caseId === caseId && s.status === 'scheduled' && s.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]
}