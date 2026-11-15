import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo, Tajawal } from 'next/font/google'
import { ToastProvider } from '@/components/feedback/toast-provider'
import { ConfirmProvider } from '@/components/feedback/confirm-provider'
import { StoreProvider } from '@/lib/store'
import { AppShell } from '@/components/shell/app-shell'
<<<<<<< HEAD
import SecurityGate from '@/components/security-gate'
=======
>>>>>>> debbd568e0a0978a92029616c9d8b7614efe5fcc
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
 HEAD
        <SecurityGate>
          <ToastProvider>
            <ConfirmProvider>
              <StoreProvider>
                <AppShell>{children}</AppShell>
              </StoreProvider>
            </ConfirmProvider>
          </ToastProvider>
        </SecurityGate>
=======
        <ToastProvider>
          <ConfirmProvider>
            <StoreProvider>
              <AppShell>{children}</AppShell>
            </StoreProvider>
          </ConfirmProvider>
        </ToastProvider>
 debbd568e0a0978a92029616c9d8b7614efe5fcc
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
 HEAD
}
=======
}
 debbd568e0a0978a92029616c9d8b7614efe5fcc
