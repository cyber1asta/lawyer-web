import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo, Tajawal } from 'next/font/google'
import { ToastProvider } from '@/components/feedback/toast-provider'
import { ConfirmProvider } from '@/components/feedback/confirm-provider'
import { StoreProvider } from '@/lib/store'
import { AppShell } from '@/components/shell/app-shell'
import './globals.css'

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo', weight: ['400', '500', '600', '700', '800'] })
const tajawal = Tajawal({ subsets: ['arabic', 'latin'], variable: '--font-tajawal', weight: ['500', '700', '800'] })

export const metadata: Metadata = {
  title: 'تدبير القضايا | نظام إدارة الملفات القضائية',
  description: 'نظام مغربي لتدبير ملفات القضايا والجلسات والإشعارات لمكاتب المحاماة',
}

export const viewport: Viewport = {
  themeColor: '#0B1B2F',
  colorScheme: 'light',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar-MA" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body className="antialiased">
        <ToastProvider>
          <ConfirmProvider>
            <StoreProvider>
              <AppShell>{children}</AppShell>
            </StoreProvider>
          </ConfirmProvider>
        </ToastProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
