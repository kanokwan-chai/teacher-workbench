'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Sparkles, ArrowRight } from 'lucide-react';
import {
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
  CuteBellIcon,
} from '@/components/icons/CuteIcons';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const ROUTE_META: { prefix: string; badge: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { prefix: '/exam-shuffler', badge: 'คลัง & สลับข้อสอบ', Icon: CuteFolderIcon },
  { prefix: '/worksheets', badge: 'จัดรูปแบบใบงาน', Icon: CuteWorksheetIcon },
  { prefix: '/questions', badge: 'AI ออกข้อสอบ', Icon: CuteRobotIcon },
  { prefix: '/answer-sheet', badge: 'กระดาษคำตอบ', Icon: CuteAnswerSheetIcon },
  { prefix: '/library', badge: 'คลังเนื้อหา', Icon: CuteBooksIcon },
  { prefix: '/file-converter', badge: 'แปลงไฟล์ PDF', Icon: CutePdfToImgIcon },
  { prefix: '/pdf-tools', badge: 'เครื่องมือ PDF', Icon: CutePdfRedIcon },
  { prefix: '/ocr-scanner', badge: 'OCR สแกนข้อความ', Icon: CuteOcrIcon },
  { prefix: '/settings', badge: 'ตั้งค่าระบบ', Icon: CuteGearIcon },
];

const QUICK_SEARCH_TOOLS = [
  { label: 'หน้าหลัก Dashboard', desc: 'ภาพรวมเครื่องมือทั้งหมด', href: '/', keywords: 'หน้าหลัก dashboard home' },
  { label: 'สลับข้อสอบ & คลังข้อสอบ A-B-C', desc: 'สุ่มลำดับข้อ + เฉลยอัตโนมัติ', href: '/exam-shuffler', keywords: 'สลับข้อสอบ คลังข้อสอบ exam shuffle' },
  { label: 'จัดรูปแบบใบงาน (DOCX / PDF)', desc: 'สร้างใบงานสวยพร้อมพิมพ์', href: '/worksheets', keywords: 'ใบงาน worksheet docx pdf' },
  { label: 'AI ออกข้อสอบอัตโนมัติ', desc: 'ให้ AI สร้างข้อสอบจากเนื้อหา', href: '/questions', keywords: 'ai ออกข้อสอบ question' },
  { label: 'สร้างกระดาษคำตอบฝน', desc: 'กระดาษคำตอบ 4/5 ตัวเลือก', href: '/answer-sheet', keywords: 'กระดาษคำตอบ omr answer sheet' },
  { label: 'คลังเนื้อหาและบทเรียน', desc: 'จัดการบทเรียนและไฟล์เนื้อหา', href: '/library', keywords: 'คลังเนื้อหา บทเรียน library' },
  { label: 'แปลงไฟล์ PDF ↔ รูปภาพ / แยกหน้า', desc: 'PDF เป็น PNG/JPG, รูปภาพเป็น PDF', href: '/file-converter', keywords: 'แปลงไฟล์ pdf รูปภาพ แยกหน้า image' },
  { label: 'เครื่องมือจัดการ PDF', desc: 'รวม PDF, ลบหน้า, พิมพ์, บีบอัด', href: '/pdf-tools', keywords: 'รวม pdf ลบหน้า บีบอัด พิมพ์ merge compress' },
  { label: 'OCR สแกนข้อความจากภาพ/PDF', desc: 'แกะข้อความภาษาไทยแม่นยำสูง', href: '/ocr-scanner', keywords: 'ocr สแกนข้อความ รูปภาพ' },
  { label: 'ตั้งค่าระบบ (API Keys)', desc: 'ตั้งค่า Gemini API และฐานข้อมูล', href: '/settings', keywords: 'ตั้งค่า settings api key' },
];

function stripLeadingEmoji(text?: string) {
  if (!text) return '';
  return text.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\s]+/u, '').trim();
}

export function Header({ title, subtitle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const routeInfo = useMemo(() => {
    if (pathname === '/') return { badge: 'หน้าหลัก', Icon: CuteHouseIcon };
    const matched = ROUTE_META.find((r) => pathname.startsWith(r.prefix));
    return matched || { badge: stripLeadingEmoji(title) || 'Workbench', Icon: CuteHouseIcon };
  }, [pathname, title]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_SEARCH_TOOLS.slice(0, 5);
    return QUICK_SEARCH_TOOLS.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.keywords.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const BadgeIcon = routeInfo.Icon;
  const cleanTitle = pathname === '/' ? 'หน้าหลัก' : stripLeadingEmoji(title) || routeInfo.badge;

  return (
    <header className="bg-white/78 backdrop-blur-xl border-b border-white/90 sticky top-0 z-20 px-5 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_24px_rgba(148,163,184,0.08)] print:hidden">
      {/* Left: Cute Active Page Pill + Subtitle */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-gradient-to-r from-[#d4b6ff] via-[#b78eff] to-[#9b6bff] text-white shadow-[0_4px_14px_rgba(139,92,246,0.3)] shrink-0">
          <span className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-2xs">
            <BadgeIcon className="w-5 h-5" />
          </span>
          <span className="text-[13px] font-bold tracking-tight whitespace-nowrap">
            {cleanTitle}
          </span>
        </div>

        {subtitle && (
          <>
            <span className="hidden md:inline-block h-4 w-[1.5px] bg-slate-200 rounded-full shrink-0" />
            <p className="hidden md:block text-[12.5px] text-slate-500 font-medium truncate">
              {subtitle}
            </p>
          </>
        )}
      </div>

      {/* Right: Pill Search Input + Cute Bell */}
      <div className="flex items-center gap-3 shrink-0">
        <div ref={searchRef} className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-violet-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults[0]) {
                  router.push(searchResults[0].href);
                  setSearchFocused(false);
                  setQuery('');
                }
              }}
              placeholder="ค้นหาไฟล์, ใบงาน, ข้อสอบ..."
              className="w-48 sm:w-64 lg:w-72 pl-10 pr-4 py-2 rounded-full bg-slate-50/90 hover:bg-white focus:bg-white border border-sky-100/90 focus:border-violet-300 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all shadow-inner"
            />
          </div>

          {searchFocused && (
            <div className="absolute right-0 mt-2 w-80 bg-white/98 backdrop-blur-xl rounded-3xl border border-sky-100 shadow-[0_16px_40px_rgba(100,116,139,0.18)] p-2 z-50">
              <p className="px-3 py-1.5 text-[11px] font-bold text-violet-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                ทางลัดเครื่องมือ
              </p>
              {searchResults.length === 0 ? (
                <p className="px-3 py-4 text-xs text-slate-400 text-center">ไม่พบเครื่องมือที่ค้นหา</p>
              ) : (
                <div className="space-y-0.5">
                  {searchResults.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() => {
                        setSearchFocused(false);
                        setQuery('');
                      }}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl hover:bg-violet-50/80 transition group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 group-hover:text-violet-700 truncate">
                          {tool.label}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{tool.desc}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-violet-500 shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div ref={bellRef} className="relative">
          <button
            type="button"
            onClick={() => setBellOpen((prev) => !prev)}
            aria-label="การแจ้งเตือน"
            className="relative w-10 h-10 rounded-full bg-white hover:bg-violet-50 border border-sky-100 shadow-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <CuteBellIcon className="w-6 h-6" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white/98 backdrop-blur-xl rounded-3xl border border-sky-100 shadow-[0_16px_40px_rgba(100,116,139,0.18)] p-4 z-50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">การแจ้งเตือนและเคล็ดลับ ✨</h4>
                <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold">
                  พร้อมใช้งาน
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <Link
                  href="/ocr-scanner"
                  onClick={() => setBellOpen(false)}
                  className="block p-2.5 rounded-2xl bg-sky-50/80 hover:bg-sky-100/70 transition"
                >
                  <p className="font-bold text-slate-700">OCR สแกนข้อความภาษาไทย</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">แกะข้อความจากภาพและ PDF ได้ทันที สระไม่ลอย</p>
                </Link>
                <Link
                  href="/exam-shuffler"
                  onClick={() => setBellOpen(false)}
                  className="block p-2.5 rounded-2xl bg-violet-50/80 hover:bg-violet-100/70 transition"
                >
                  <p className="font-bold text-slate-700">สลับข้อสอบชุด A-B-C อัตโนมัติ</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">สุ่มข้อและตัวเลือก พร้อมสร้างเฉลยใหม่ทันที</p>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
