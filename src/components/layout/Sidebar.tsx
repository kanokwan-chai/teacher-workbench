'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronRight, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import {
  CuteLaptopLogo,
  CuteHouseIcon,
  CuteFolderIcon,
  CuteWorksheetIcon,
  CuteRobotIcon,
  CuteAnswerSheetIcon,
  CuteBooksIcon,
  CutePdfToImgIcon,
  CutePdfRedIcon,
  CuteOcrIcon,
  CuteGearIcon,
  CuteTeacherAvatar,
} from '@/components/icons/CuteIcons';

const navItems = [
  { href: '/', label: 'หน้าหลัก (Dashboard)', Icon: CuteHouseIcon },
  { href: '/exam-shuffler', label: 'สลับข้อสอบ & คลังข้อสอบ', Icon: CuteFolderIcon },
  { href: '/worksheets', label: 'จัดรูปแบบใบงาน (DOCX/PDF)', Icon: CuteWorksheetIcon },
  { href: '/questions', label: 'AI ออกข้อสอบอัตโนมัติ', Icon: CuteRobotIcon },
  { href: '/answer-sheet', label: 'สร้างกระดาษคำตอบ', Icon: CuteAnswerSheetIcon },
  { href: '/library', label: 'คลังเนื้อหาและบทเรียน', Icon: CuteBooksIcon },
  { href: '/file-converter', label: 'แปลงไฟล์ PDF → ภาพ', Icon: CutePdfToImgIcon },
  { href: '/pdf-tools', label: 'เครื่องมือจัดการ PDF', Icon: CutePdfRedIcon },
  { href: '/ocr-scanner', label: 'OCR สแกนข้อความ', Icon: CuteOcrIcon },
  { href: '/settings', label: 'ตั้งค่าระบบ', Icon: CuteGearIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [teacherName, setTeacherName] = useState('คุณครูคนเก่ง');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('TEACHER_PROFILE_NAME');
      if (saved && saved.trim()) setTeacherName(saved.trim());
    } catch {
      // ignore storage errors
    }
  }, []);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* App Logo Header */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
          <CuteLaptopLogo className="w-13 h-13 shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform duration-200" />
          <div className="leading-tight">
            <h1 className="font-extrabold text-[17px] tracking-tight text-slate-800 leading-[1.15]">
              Exam &amp; File
              <span className="block bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] bg-clip-text text-transparent">
                Workbench
              </span>
            </h1>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5 leading-snug">
              ระบบคลังข้อสอบและจัดการเอกสารครู
            </p>
          </div>
        </Link>
      </div>

      <div className="mx-5 border-b border-sky-100/90" />

      {/* Navigation Links */}
      <nav className="flex-1 px-3.5 py-3.5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const { Icon } = item;
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-[#b589ff] via-[#9d6eff] to-[#8b5cf6] text-white font-semibold shadow-[0_8px_20px_-6px_rgba(139,92,246,0.55)]'
                  : 'text-slate-700 font-medium hover:bg-sky-50/90 hover:text-violet-700 hover:translate-x-0.5'
              )}
            >
              <span
                className={clsx(
                  'w-7 h-7 flex items-center justify-center rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'bg-white/20 backdrop-blur-xs' : ''
                )}
              >
                <Icon className="w-6 h-6 drop-shadow-[0_2px_3px_rgba(15,23,42,0.12)]" />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Teacher Profile Card */}
      <div className="p-3.5 border-t border-sky-100/80">
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-r from-sky-50/90 via-indigo-50/60 to-violet-50/80 border border-white shadow-[0_4px_14px_rgba(148,163,184,0.12)] hover:shadow-md hover:scale-[1.01] transition-all group"
        >
          <CuteTeacherAvatar className="w-11 h-11 shrink-0 drop-shadow-xs" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-slate-800 truncate">{teacherName}</p>
            <p className="text-[11px] font-medium text-violet-600/90">ครูผู้สอน ✨</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="เปิดเมนู"
        className="lg:hidden fixed bottom-5 right-5 z-50 w-13 h-13 rounded-full cute-pill-btn flex items-center justify-center shadow-lg print:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex print:hidden">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[276px] max-w-[85vw] bg-white/95 backdrop-blur-xl h-full shadow-2xl z-10">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="ปิดเมนู"
              className="absolute top-4 right-3 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[268px] shrink-0 bg-white/92 backdrop-blur-xl border-r border-white/90 flex-col h-screen sticky top-0 shadow-[6px_0_30px_rgba(148,163,184,0.1)] z-30 print:hidden">
        {sidebarContent}
      </aside>
    </>
  );
}
