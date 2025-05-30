import type { Metadata, Viewport } from 'next';
import './globals.css';
import { OfflineStatus } from '@/components/offline-status';
import { getSession } from '@/lib/auth';
import ClientOnly from '@/components/client-only';

export const metadata: Metadata = {
  title: 'LeLink Healthcare',
  description: 'Privacy-preserving healthcare data management system',
  generator: 'v0.dev',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        <OfflineStatus />
        <ClientOnly session={session}>{children}</ClientOnly>
      </body>
    </html>
  );
}
