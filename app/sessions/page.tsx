import type { Metadata } from 'next'
import { SessionsView } from '@/components/sessions/sessions-view'

export const metadata: Metadata = { title: 'الجلسات والمواعيد | تدبير القضايا' }

export default function SessionsPage() {
  return <SessionsView />
}
