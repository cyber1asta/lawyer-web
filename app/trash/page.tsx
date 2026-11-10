import type { Metadata } from 'next'
import { TrashView } from '@/components/trash/trash-view'

export const metadata: Metadata = { title: 'سلة المحذوفات | تدبير القضايا' }

export default function Page() {
  return <TrashView />
}
