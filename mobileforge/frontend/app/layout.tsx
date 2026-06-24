import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import ErrorBoundary from '@/components/ErrorBoundary';
import FeedbackWidget from '@/components/FeedbackWidget';
import BetaGate from '@/components/BetaGate';
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
  description: 'Describe an app, get full Expo code. Build iOS and Android apps with AI.',
  keywords: ['mobile app builder', 'React Native', 'Expo', 'AI', 'no-code'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${jakarta.variable} ${heebo.variable}`}>
      <body className="bg-bg text-text-primary min-h-screen font-body">
        <ErrorBoundary>
          <BetaGate>
            <Providers>{children}</Providers>
            {process.env.NEXT_PUBLIC_BETA !== '0' && <FeedbackWidget />}
          </BetaGate>
        </ErrorBoundary>
      </body>
    </html>
  );
}
