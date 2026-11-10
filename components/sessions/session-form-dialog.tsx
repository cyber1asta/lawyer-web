'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Modal } from '@/components/feedback/modal'
import { useConfirm } from '@/components/feedback/confirm-provider'
import { AppButton } from '@/components/ui-kit/app-button'
import { DateField, SelectField, TextAreaField, TextField } from '@/components/ui-kit/fields'
import { useStore } from '@/lib/store'
import { formatDate, ownerName, sessionKindLabel, todayISO } from '@/lib/format'
import type { Session, SessionInput, SessionKind } from '@/lib/types'

export function SessionFormDialog() {
  const { ui } = useStore()
  const { open, editing } = ui.sessionForm
  return (
    <Modal open={open} onClose={ui.closeSessionForm} title={editing ? 'تعديل الموعد' : 'إضافة موعد جديد'} description="الحقول المشار إليها بـ * إلزامية">
      {open && <SessionForm key={editing?.id ?? `new-${ui.sessionForm.presetDate}-${ui.sessionForm.presetCaseId}`} editing={editing} />}
    </Modal>
  )
}

function SessionForm({ editing }: { editing: Session | null }) {
  const { state, actions, ui } = useStore()
  const confirm = useConfirm()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<SessionInput>(() => {
    if (editing) {
      const { id: _id, ...rest } = editing
      return rest
    }
    const linked = state.cases.find((c) => c.id === ui.sessionForm.presetCaseId)
    return {
      title: 'جلسة المناقشة',
      caseId: linked?.id ?? null,
      date: ui.sessionForm.presetDate ?? todayISO(),
      time: '09:00',
      court: linked?.court ?? '',
      room: '',
      kind: 'hearing',
      status: 'scheduled',
      note: '',
    }
  })

  const set = <K extends keyof SessionInput>(key: K, value: SessionInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const submit = async () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'عنوان الموعد إلزامي'
    if (!form.date) e.date = 'التاريخ إلزامي'
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.time)) e.time = 'الساعة بصيغة 24 ساعة، مثال 09:30'
    setErrors(e)
    if (Object.keys(e).length) return
    const ok = await confirm({
      title: editing ? 'تأكيد تعديل الموعد' : 'تأكيد إضافة الموعد',
      description: `${form.title} بتاريخ ${formatDate(form.date)} على الساعة ${form.time}. يمكنك التراجع خلال 8 ثوان.`,
      confirmLabel: editing ? 'حفظ' : 'إضافة',
    })
    if (!ok) return
    actions.saveSession({ ...form, title: form.title.trim() }, editing?.id)
    ui.closeSessionForm()
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <TextField label="عنوان الموعد" required value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} autoFocus className="sm:col-span-2" />
      <SelectField label="نوع الموعد" required value={form.kind} onChange={(e) => set('kind', e.target.value as SessionKind)}>
        {(Object.keys(sessionKindLabel) as SessionKind[]).map((k) => (
          <option key={k} value={k}>
            {sessionKindLabel[k]}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="الملف المرتبط"
        value={form.caseId ?? ''}
        onChange={(e) => {
          const c = state.cases.find((x) => x.id === e.target.value)
          setForm((f) => ({ ...f, caseId: c?.id ?? null, court: c && !f.court ? c.court : f.court }))
        }}
      >
        <option value="">— بدون ملف —</option>
        {state.cases.map((c) => (
          <option key={c.id} value={c.id}>
            {c.ref} - {ownerName(c)}
          </option>
        ))}
      </SelectField>
      <DateField label="التاريخ" required value={form.date} onChange={(v) => set('date', v ?? '')} error={errors.date} />
      <TextField label="الساعة" required dir="ltr" placeholder="09:30" value={form.time} onChange={(e) => set('time', e.target.value)} error={errors.time} className="[&_input]:text-right" />
      <SelectField label="المحكمة / المكان" value={form.court} onChange={(e) => set('court', e.target.value)}>
        <option value="">— اختر —</option>
        <option>مقر المكتب</option>
        {state.courts.map((c) => (
          <option key={c.id}>{c.name}</option>
        ))}
      </SelectField>
      <TextField label="القاعة" placeholder="القاعة 3" value={form.room} onChange={(e) => set('room', e.target.value)} />
      <TextAreaField label="ملاحظة" className="sm:col-span-2" value={form.note} onChange={(e) => set('note', e.target.value)} />
      <div className="flex justify-end gap-3 border-t border-border pt-5 sm:col-span-2">
        <AppButton variant="ghost" onClick={ui.closeSessionForm}>
          إلغاء
        </AppButton>
        <AppButton type="submit" variant="gold">
          <Check className="size-4" aria-hidden />
          {editing ? 'حفظ التعديلات' : 'إضافة الموعد'}
        </AppButton>
      </div>
    </form>
  )
}

export function PostponeDialog({ session, onClose }: { session: Session | null; onClose: () => void }) {
  return (
    <Modal open={!!session} onClose={onClose} title="تأجيل الموعد" description={session ? `${session.title} - ${formatDate(session.date)}` : ''} size="sm">
      {session && <PostponeForm key={session.id} session={session} onClose={onClose} />}
    </Modal>
  )
}

function PostponeForm({ session, onClose }: { session: Session; onClose: () => void }) {
  const { actions } = useStore()
  const confirm = useConfirm()
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState(session.time)
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault()
        const err: Record<string, string> = {}
        if (!date) err.date = 'التاريخ الجديد إلزامي'
        else if (date <= session.date) err.date = 'يجب أن يكون التاريخ الجديد بعد التاريخ الحالي'
        if (!reason.trim()) err.reason = 'سبب التأجيل إلزامي'
        setErrors(err)
        if (Object.keys(err).length || !date) return
        const ok = await confirm({ title: 'تأكيد التأجيل', description: `سيتم تأجيل الموعد إلى ${formatDate(date)} على الساعة ${time}.`, confirmLabel: 'تأجيل' })
        if (!ok) return
        actions.postponeSession(session.id, date, time, reason.trim())
        onClose()
      }}
    >
      <DateField label="التاريخ الجديد" required value={date} onChange={setDate} error={errors.date} />
      <TextField label="الساعة" dir="ltr" value={time} onChange={(e) => setTime(e.target.value)} className="[&_input]:text-right" />
      <TextAreaField label="سبب التأجيل" required value={reason} onChange={(e) => setReason(e.target.value)} error={errors.reason} placeholder="مثال: لإعداد الدفاع، لاستدعاء الطرف الآخر..." />
      <div className="flex justify-end gap-3">
        <AppButton variant="ghost" onClick={onClose}>
          إلغاء
        </AppButton>
        <AppButton type="submit" variant="gold">
          تأجيل الموعد
        </AppButton>
      </div>
    </form>
  )
}
