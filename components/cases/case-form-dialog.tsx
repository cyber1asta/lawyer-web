'use client'

import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Modal } from '@/components/feedback/modal'
import { useConfirm } from '@/components/feedback/confirm-provider'
import { AppButton } from '@/components/ui-kit/app-button'
import { DateField, SelectField, TextAreaField, TextField } from '@/components/ui-kit/fields'
import { useStore } from '@/lib/store'
import { caseStatusLabel, isValidCin, isValidPhone, normalizeArabic, noticeStatusLabel, ownerName, todayISO } from '@/lib/format'
import type { CaseFile, CaseInput, CaseStatus, NoticeStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const steps = ['صاحب القضية', 'معلومات القضية', 'الإشعار والملاحظات']

function emptyInput(defaults: { type: string; court: string; method: string }): CaseInput {
  return {
    courtRef: '',
    firstName: '',
    familyName: '',
    gender: 'm',
    fatherName: '',
    motherName: '',
    phone: '',
    cin: '',
    city: '',
    caseDate: todayISO(),
    type: defaults.type,
    court: defaults.court,
    opponent: '',
    amount: null,
    noticeDate: null,
    noticeMethod: defaults.method,
    noticeStatus: 'pending',
    status: 'active',
    notes: '',
  }
}

type Errors = Partial<Record<keyof CaseInput, string>>

function validateStep(step: number, f: CaseInput): Errors {
  const e: Errors = {}
  if (step === 0) {
    if (!f.firstName.trim()) e.firstName = 'الاسم الشخصي إلزامي'
    if (!f.familyName.trim()) e.familyName = 'الاسم العائلي إلزامي'
    if (!f.fatherName.trim()) e.fatherName = 'اسم الأب إلزامي'
    if (!f.motherName.trim()) e.motherName = 'اسم الأم إلزامي'
    if (f.phone && !isValidPhone(f.phone)) e.phone = 'رقم الهاتف غير صحيح، مثال: 06 12 34 56 78 أو 212612345678+'
    if (f.cin && !isValidCin(f.cin)) e.cin = 'رقم البطاقة الوطنية غير صحيح، مثال: AB123456'
  }
  if (step === 1) {
    if (!f.caseDate) e.caseDate = 'تاريخ القضية إلزامي'
    if (!f.type) e.type = 'نوع القضية إلزامي'
    if (!f.court) e.court = 'المحكمة إلزامية'
    if (f.courtRef && !/^\d+\/\d+\/\d{4}$/.test(f.courtRef.trim())) e.courtRef = 'الصيغة: رقم/رمز/سنة، مثال 458/1201/2026'
    if (f.amount != null && (Number.isNaN(f.amount) || f.amount < 0)) e.amount = 'المبلغ غير صحيح'
  }
  if (step === 2) {
    if (!f.noticeMethod) e.noticeMethod = 'طريقة التبليغ إلزامية'
    if (f.noticeStatus === 'received' && !f.noticeDate) e.noticeDate = 'تاريخ التوصل بالإشعار إلزامي عند التوصل'
  }
  return e
}

export function CaseFormDialog() {
  const { ui } = useStore()
  return (
    <Modal
      open={ui.caseForm.open}
      onClose={ui.closeCaseForm}
      title={ui.caseForm.editing ? `تعديل الملف ${ui.caseForm.editing.ref}` : 'إضافة ملف جديد'}
      description="الحقول المشار إليها بـ * إلزامية"
      size="lg"
    >
      {ui.caseForm.open && <CaseForm key={ui.caseForm.editing?.id ?? 'new'} editing={ui.caseForm.editing} />}
    </Modal>
  )
}

function CaseForm({ editing }: { editing: CaseFile | null }) {
  const { state, actions, ui } = useStore()
  const confirm = useConfirm()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})
  const [form, setForm] = useState<CaseInput>(() => {
    if (editing) {
      const { id: _id, ref: _ref, createdAt: _c, ...rest } = editing
      return rest
    }
    return emptyInput({ type: state.caseTypes[0] ?? '', court: state.courts[0]?.name ?? '', method: state.noticeMethods[0] ?? '' })
  })

  const set = <K extends keyof CaseInput>(key: K, value: CaseInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const goNext = () => {
    const e = validateStep(step, form)
    setErrors(e)
    if (Object.keys(e).length === 0) setStep((s) => s + 1)
  }

  const submit = async () => {
    for (let i = 0; i < steps.length; i++) {
      const e = validateStep(i, form)
      if (Object.keys(e).length) {
        setErrors(e)
        setStep(i)
        return
      }
    }
    const fullName = normalizeArabic(ownerName(form))
    const duplicate = state.cases.find((c) => c.id !== editing?.id && normalizeArabic(ownerName(c)) === fullName && c.type === form.type)
    const ok = await confirm({
      title: editing ? 'تأكيد حفظ التعديلات' : 'تأكيد إضافة الملف',
      description: duplicate
        ? `تنبيه: يوجد ملف مشابه (${duplicate.ref}) لنفس الشخص ونفس نوع القضية. هل تريد المتابعة رغم ذلك؟`
        : editing
          ? `سيتم حفظ التعديلات على الملف ${editing.ref}. يمكنك التراجع خلال 8 ثوان.`
          : `سيتم فتح ملف جديد باسم ${ownerName(form)}. يمكنك التراجع خلال 8 ثوان.`,
      confirmLabel: editing ? 'حفظ التعديلات' : 'إضافة الملف',
    })
    if (!ok) return
    const clean: CaseInput = {
      ...form,
      firstName: form.firstName.trim(),
      familyName: form.familyName.trim(),
      fatherName: form.fatherName.trim(),
      motherName: form.motherName.trim(),
      cin: form.cin.trim().toUpperCase(),
      noticeDate: form.noticeStatus === 'received' ? form.noticeDate : form.noticeDate,
    }
    actions.saveCase(clean, editing?.id)
    ui.closeCaseForm()
  }

  const courtOptions = state.courts.some((c) => c.name === form.court) || !form.court ? state.courts : [...state.courts, { id: 'x', name: form.court, city: '' }]

  return (
    <div className="flex flex-col gap-6">
      <ol className="grid grid-cols-3 gap-2" aria-label="مراحل إضافة الملف">
        {steps.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => (i < step ? setStep(i) : undefined)}
              aria-current={i === step ? 'step' : undefined}
              className="flex w-full flex-col gap-2 text-start"
            >
              <span className={cn('h-1.5 rounded-full transition-colors duration-500', i <= step ? 'bg-gold' : 'bg-muted')} />
              <span className={cn('flex items-center gap-1.5 text-xs font-bold', i === step ? 'text-navy' : 'text-muted-foreground')}>
                {i < step && <Check className="size-3.5 text-emerald-600" aria-hidden />}
                {i + 1}. {label}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (step < steps.length - 1) goNext()
          else void submit()
        }}
        className="flex flex-col gap-6"
        noValidate
      >
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="الاسم الشخصي" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} error={errors.firstName} autoFocus />
            <TextField label="الاسم العائلي" required value={form.familyName} onChange={(e) => set('familyName', e.target.value)} error={errors.familyName} />
            <SelectField label="الجنس" required value={form.gender} onChange={(e) => set('gender', e.target.value as 'm' | 'f')}>
              <option value="m">ذكر</option>
              <option value="f">أنثى</option>
            </SelectField>
            <SelectField label="المدينة" value={form.city} onChange={(e) => set('city', e.target.value)}>
              <option value="">— اختر المدينة —</option>
              {state.cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectField>
            <TextField label="اسم الأب" required value={form.fatherName} onChange={(e) => set('fatherName', e.target.value)} error={errors.fatherName} />
            <TextField label="اسم الأم" required value={form.motherName} onChange={(e) => set('motherName', e.target.value)} error={errors.motherName} />
            <TextField label="رقم الهاتف" dir="ltr" inputMode="tel" placeholder="06 12 34 56 78" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} className="[&_input]:text-right" />
            <TextField label="رقم البطاقة الوطنية" dir="ltr" placeholder="AB123456" value={form.cin} onChange={(e) => set('cin', e.target.value)} error={errors.cin} className="[&_input]:text-right" />
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="نوع القضية" required value={form.type} onChange={(e) => set('type', e.target.value)} error={errors.type}>
              {state.caseTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </SelectField>
            <SelectField label="المحكمة" required value={form.court} onChange={(e) => set('court', e.target.value)} error={errors.court}>
              {courtOptions.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </SelectField>
            <DateField label="تاريخ القضية" required value={form.caseDate} onChange={(v) => set('caseDate', v ?? '')} error={errors.caseDate} />
            <TextField label="رقم الملف بالمحكمة" dir="ltr" placeholder="458/1201/2026" value={form.courtRef} onChange={(e) => set('courtRef', e.target.value)} error={errors.courtRef} className="[&_input]:text-right" />
            <TextField label="الطرف الآخر" value={form.opponent} onChange={(e) => set('opponent', e.target.value)} />
            <TextField
              label="المبلغ المطلوب (درهم)"
              inputMode="numeric"
              value={form.amount ?? ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/\s/g, '')
                set('amount', raw === '' ? null : Number(raw))
              }}
              error={errors.amount}
            />
            <SelectField label="حالة الملف" value={form.status} onChange={(e) => set('status', e.target.value as CaseStatus)}>
              {(Object.keys(caseStatusLabel) as CaseStatus[]).map((s) => (
                <option key={s} value={s}>
                  {caseStatusLabel[s]}
                </option>
              ))}
            </SelectField>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="حالة الإشعار" required value={form.noticeStatus} onChange={(e) => set('noticeStatus', e.target.value as NoticeStatus)}>
              {(Object.keys(noticeStatusLabel) as NoticeStatus[]).map((s) => (
                <option key={s} value={s}>
                  {noticeStatusLabel[s]}
                </option>
              ))}
            </SelectField>
            <SelectField label="طريقة التبليغ" required value={form.noticeMethod} onChange={(e) => set('noticeMethod', e.target.value)} error={errors.noticeMethod}>
              {state.noticeMethods.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </SelectField>
            <DateField
              label="تاريخ التوصل بالإشعار"
              required={form.noticeStatus === 'received'}
              value={form.noticeDate}
              onChange={(v) => set('noticeDate', v)}
              error={errors.noticeDate}
            />
            <TextAreaField label="ملاحظات" className="sm:col-span-2" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="ملاحظات داخلية حول الملف" />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <AppButton variant="ghost" onClick={ui.closeCaseForm}>
            إلغاء
          </AppButton>
          <div className="flex gap-3">
            {step > 0 && (
              <AppButton variant="outline" onClick={() => setStep((s) => s - 1)}>
                <ChevronRight className="size-4" aria-hidden />
                السابق
              </AppButton>
            )}
            {step < steps.length - 1 ? (
              <AppButton type="submit">
                التالي
                <ChevronLeft className="size-4" aria-hidden />
              </AppButton>
            ) : (
              <AppButton type="submit" variant="gold">
                <Check className="size-4" aria-hidden />
                {editing ? 'حفظ التعديلات' : 'إضافة الملف'}
              </AppButton>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
