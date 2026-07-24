import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'EdgeSync - Trading Intelligence',
  description: 'Sync your health data with your trading performance. The edge you can feel.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="noise-bg">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 ml-[260px]">
            <Header />
            <main className="p-8 page-enter">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
