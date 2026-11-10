'use client'

import { useState } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { PageHeader, Card } from '@/components/shell/page-header'
import { AppButton } from '@/components/ui-kit/app-button'
import { TextField } from '@/components/ui-kit/fields'
import { useConfirm } from '@/components/feedback/confirm-provider'
import { useStore } from '@/lib/store'
import { toLatinDigits } from '@/lib/format'
import type { ListKey, OfficeProfile } from '@/lib/types'

export function SettingsView() {
  return (
    <>
      <PageHeader title="الإعدادات" subtitle="معلومات المكتب والقوائم المرجعية" />
      <div className="grid gap-6 lg:grid-cols-2">
        <OfficeCard />
        <CourtsCard />
        <ListCard list="caseTypes" title="أنواع القضايا" placeholder="مثال: استعجالية" />
        <ListCard list="cities" title="المدن" placeholder="مثال: الجديدة" />
        <ListCard list="noticeMethods" title="طرق التبليغ" placeholder="مثال: عن طريق البريد المضمون" />
      </div>
    </>
  )
}

function OfficeCard() {
  const { state, actions } = useStore()
  const confirm = useConfirm()
  const [form, setForm] = useState<OfficeProfile>(state.office)
  const fields: [keyof OfficeProfile, string][] = [
    ['officeName', 'اسم المكتب'],
    ['lawyerName', 'اسم المحامي'],
    ['bar', 'هيئة المحامين'],
    ['city', 'المدينة'],
    ['phone', 'الهاتف'],
  ]
  return (
    <Card className="p-5">
      <h2 className="mb-4 font-bold">معلومات المكتب</h2>
      <form
        className="grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          if (await confirm({ title: 'حفظ معلومات المكتب', description: 'سيتم تحديث معلومات المكتب.', confirmLabel: 'حفظ' })) actions.saveOffice(form)
        }}
      >
        {fields.map(([k, label]) => (
          <TextField key={k} label={label} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
        ))}
        <AppButton type="submit" className="justify-self-start">
          <Check className="size-4" aria-hidden />
          حفظ
        </AppButton>
      </form>
    </Card>
  )
}

function CourtsCard() {
  const { state, actions } = useStore()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')

  const start = (id: string | null, n = '', c = '') => {
    setEditing(id)
    setName(n)
    setCity(c)
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">المحاكم</h2>
        <AppButton size="sm" variant="soft" onClick={() => start('new', '', state.cities[0] ?? '')}>
          <Plus className="size-4" aria-hidden />
          إضافة محكمة
        </AppButton>
      </div>
      {editing && (
        <form
          className="mb-4 grid gap-3 rounded-xl bg-muted/50 p-3 sm:grid-cols-[1fr_160px_auto]"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!name.trim()) return
            const ok = await confirm({ title: editing === 'new' ? 'إضافة محكمة' : 'تعديل المحكمة', description: name.trim(), confirmLabel: 'حفظ' })
            if (!ok) return
            actions.saveCourt({ name: name.trim(), city }, editing === 'new' ? undefined : editing)
            start(null)
          }}
        >
          <label className="sr-only" htmlFor="court-name">اسم المحكمة</label>
          <input id="court-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="المحكمة الابتدائية ب..." className="h-10 rounded-lg border border-border bg-card px-3 text-sm" />
          <label className="sr-only" htmlFor="court-city">المدينة</label>
          <select id="court-city" value={city} onChange={(e) => setCity(e.target.value)} className="h-10 rounded-lg border border-border bg-card px-2 text-sm">
            {state.cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <AppButton type="submit" size="sm" className="h-10">حفظ</AppButton>
            <AppButton size="sm" variant="ghost" className="h-10" onClick={() => start(null)}>إلغاء</AppButton>
          </div>
        </form>
      )}
      <ul className="max-h-96 divide-y divide-border overflow-y-auto">
        {state.courts.map((c) => (
          <li key={c.id} className="flex items-center gap-3 py-2.5 text-sm">
            <span className="flex-1 font-semibold">{c.name}</span>
            <span className="text-xs text-muted-foreground">{c.city}</span>
            <RowActions
              onEdit={() => start(c.id, c.name, c.city)}
              onDelete={async () => {
                if (await confirm({ title: 'حذف المحكمة', tone: 'danger', description: `حذف "${c.name}" من القائمة؟`, confirmLabel: 'حذف' })) actions.deleteCourt(c.id)
              }}
            />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function ListCard({ list, title, placeholder }: { list: ListKey; title: string; placeholder: string }) {
  const { state, actions } = useStore()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<string | null>(null)
  const [value, setValue] = useState('')
  const items = state[list]

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        <AppButton size="sm" variant="soft" onClick={() => (setEditing('__new'), setValue(''))}>
          <Plus className="size-4" aria-hidden />
          إضافة
        </AppButton>
      </div>
      {editing && (
        <form
          className="mb-4 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            const v = value.trim()
            if (!v || (items.includes(v) && v !== editing)) return
            const ok = await confirm({ title: editing === '__new' ? 'تأكيد الإضافة' : 'تأكيد التعديل', description: v, confirmLabel: 'حفظ' })
            if (!ok) return
            actions.saveListItem(list, v, editing === '__new' ? undefined : editing)
            setEditing(null)
          }}
        >
          <label className="sr-only" htmlFor={`${list}-input`}>{title}</label>
          <input
            id={`${list}-input`}
            autoFocus
            value={value}
            onChange={(e) => setValue(toLatinDigits(e.target.value))}
            placeholder={placeholder}
            className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm"
          />
          <AppButton type="submit" size="sm" className="h-10">حفظ</AppButton>
          <AppButton size="icon" variant="ghost" className="size-10" onClick={() => setEditing(null)}>
            <X className="size-4" aria-hidden />
            <span className="sr-only">إلغاء</span>
          </AppButton>
        </form>
      )}
      <ul className="flex flex-wrap gap-2">
        {items.map((v) => (
          <li key={v} className="flex items-center gap-1 rounded-full border border-border bg-muted/40 py-1 ps-3 pe-1 text-sm">
            {v}
            <RowActions
              onEdit={() => (setEditing(v), setValue(v))}
              onDelete={async () => {
                if (await confirm({ title: 'حذف العنصر', tone: 'danger', description: `حذف "${v}" من القائمة؟`, confirmLabel: 'حذف' })) actions.deleteListItem(list, v)
              }}
            />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <span className="flex">
      <button type="button" onClick={onEdit} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-navy">
        <Pencil className="size-3.5" aria-hidden />
        <span className="sr-only">تعديل</span>
      </button>
      <button type="button" onClick={onDelete} className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600">
        <Trash2 className="size-3.5" aria-hidden />
        <span className="sr-only">حذف</span>
      </button>
    </span>
  )
}
