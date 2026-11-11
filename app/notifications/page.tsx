import type { Metadata } from 'next'
import { NotificationsView } from '@/components/notifications/notifications-view'

export const metadata: Metadata = { title: 'الإشعارات | تدبير القضايا' }

export default function Page() {
  return <NotificationsView />
}
