import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Exam & File Workbench - ระบบคลังข้อสอบและจัดการเอกสารสำหรับครู',
  description: 'ระบบสลับข้อสอบสุ่ม A-B-C, สร้างกระดาษคำตอบฝน OMR, OCR สแกนข้อสอบ และแปลง/จัดการไฟล์เอกสารครูในที่เดียว',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800&family=Sarabun:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen antialiased selection:bg-violet-200 selection:text-violet-900">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
