import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Plus_Jakarta_Sans, Heebo } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heebo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MobileForge — Build Mobile Apps with AI',
  description: 'תאר אפליקציה, קבל קוד Expo מלא. בנה אפליקציות iOS ו-Android עם AI.',
  keywords: ['mobile app builder', 'React Native', 'Expo', 'AI', 'no-code'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${jakarta.variable} ${heebo.variable}`}>
      <body className="bg-bg text-text-primary min-h-screen font-body">
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
