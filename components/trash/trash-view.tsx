'use client'

import { useState, useEffect } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { PageHeader, Card } from '@/components/shell/page-header'
import { AppButton } from '@/components/ui-kit/app-button'
import { useConfirm } from '@/components/feedback/confirm-provider'
import { useStore } from '@/lib/store'
import { formatDate, ownerName } from '@/lib/format'

export function TrashView() {
  const { state, actions } = useStore()
  const confirm = useConfirm()
  const [mounted, setMounted] = useState(false)

  // حماية ضد مشاكل Hydration الناتج عن اختلاف localStorage بين السيرفر والمتصفح
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const all = state.trash.map((t) => t.id)

  return (
    <>
      <PageHeader
        title="سلة المحذوفات"
        subtitle="يمكنك استرجاع الملفات والمواعيد المحذوفة أو حذفها نهائيا"
        actions={
          <>
            <AppButton variant="outline" disabled={!all.length} onClick={() => actions.restoreTrash(all)}>
              <RotateCcw className="size-4" aria-hidden />
              استرجاع الكل
            </AppButton>
            <AppButton
              variant="danger"
              disabled={!all.length}
              onClick={async () => {
                if (await confirm({ title: 'إفراغ السلة', tone: 'danger', description: `سيتم حذف ${all.length} عنصرا نهائيا. يمكنك التراجع خلال 8 ثوان فقط.`, confirmLabel: 'إفراغ السلة' }))
                  actions.purgeTrash(all)
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              إفراغ السلة
            </AppButton>
          </>
        }
      />
      <Card>
        {state.trash.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Trash2 className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">سلة المحذوفات فارغة.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {state.trash.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">{t.kind === 'case' ? 'ملف' : 'موعد'}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {t.kind === 'case' ? `${t.item.ref} - ${ownerName(t.item)}` : `${t.item.title} - ${formatDate(t.item.date)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">حذف بتاريخ {formatDate(t.deletedAt)}</p>
                </div>
                <AppButton size="sm" variant="outline" onClick={() => actions.restoreTrash([t.id])}>
                  <RotateCcw className="size-4" aria-hidden />
                  استرجاع
                </AppButton>
                <AppButton
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={async () => {
                    if (await confirm({ title: 'حذف نهائي', tone: 'danger', description: 'سيتم حذف هذا العنصر نهائيا.', confirmLabel: 'حذف نهائي' })) actions.purgeTrash([t.id])
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                  حذف نهائي
                </AppButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}