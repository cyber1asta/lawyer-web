'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, CheckCheck, MailOpen, Trash2 } from 'lucide-react'
import { PageHeader, Card } from '@/components/shell/page-header'
import { AppButton } from '@/components/ui-kit/app-button'
import { useConfirm } from '@/components/feedback/confirm-provider'
import { useStore } from '@/lib/store'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export function NotificationsView() {
  const { state, actions } = useStore()
  const confirm = useConfirm()

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  if (!mounted) {
    return null
  }

  const list = state.notifications.filter((n) => filter === 'all' || !n.read)
  const unreadIds = state.notifications.filter((n) => !n.read).map((n) => n.id)

  return (
    <>
      <PageHeader
        title="الإشعارات"
        subtitle={`${unreadIds.length} إشعار غير مقروء`}
        actions={
          <>
            <AppButton variant="outline" disabled={!unreadIds.length} onClick={() => actions.markNotifications(unreadIds, true)}>
              <CheckCheck className="size-4" aria-hidden />
              تعليم الكل كمقروء
            </AppButton>
            <AppButton
              variant="danger"
              disabled={!state.notifications.length}
              onClick={async () => {
                const ok = await confirm({ title: 'حذف كل الإشعارات', tone: 'danger', description: `سيتم حذف ${state.notifications.length} إشعارا. يمكنك التراجع خلال 8 ثوان.`, confirmLabel: 'حذف الكل' })
                if (ok) actions.deleteNotifications(state.notifications.map((n) => n.id))
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              حذف الكل
            </AppButton>
          </>
        }
      />
      <Card>
        <div role="tablist" className="flex gap-1.5 border-b border-border px-5 py-4">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              role="tab"
              type="button"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn('rounded-lg px-3.5 py-2 text-sm font-semibold', filter === f ? 'bg-navy text-white' : 'bg-muted text-muted-foreground hover:bg-border')}
            >
              {f === 'all' ? 'الكل' : 'غير المقروءة'}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <BellOff className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">لا توجد إشعارات.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((n) => (
              <li key={n.id} className={cn('flex items-start gap-4 px-5 py-4', !n.read && 'bg-gold-soft/40')}>
                <span className={cn('mt-0.5 grid size-10 shrink-0 place-items-center rounded-full', n.read ? 'bg-muted text-muted-foreground' : 'bg-navy text-gold')}>
                  <Bell className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {n.title}
                    {!n.read && <span className="ms-2 inline-block size-2 rounded-full bg-gold align-middle" aria-label="غير مقروء" />}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.date)}</p>
                </div>
                <div className="flex gap-1">
                  <AppButton variant="ghost" size="icon" onClick={() => actions.markNotifications([n.id], !n.read)}>
                    <MailOpen className="size-4" aria-hidden />
                    <span className="sr-only">{n.read ? 'تعليم كغير مقروء' : 'تعليم كمقروء'}</span>
                  </AppButton>
                  <AppButton
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:bg-red-50"
                    onClick={async () => {
                      if (await confirm({ title: 'حذف الإشعار', tone: 'danger', description: `حذف "${n.title}"؟`, confirmLabel: 'حذف' })) actions.deleteNotifications([n.id])
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    <span className="sr-only">حذف الإشعار</span>
                  </AppButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}