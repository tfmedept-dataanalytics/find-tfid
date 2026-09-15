import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FIND — Field Insights & Notes Dashboard',
  description: 'Ruang kerja pencatatan kunjungan lapangan, penilaian kualitas bukti, dan sintesis insight untuk evaluasi program.',
  icons: { icon: '/logo-tf.png' }
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <div id="printArea" />
        <div id="toasts" />
      </body>
    </html>
  );
}
