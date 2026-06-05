import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'MobileForge — Build Mobile Apps with AI',
  description: 'תאר אפליקציה, קבל קוד Expo מלא. בנה אפליקציות iOS ו-Android עם AI.',
  keywords: ['mobile app builder', 'React Native', 'Expo', 'AI', 'no-code'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-bg text-text-primary min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
