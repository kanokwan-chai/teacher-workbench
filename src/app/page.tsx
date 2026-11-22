'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { StorageManager } from '@/lib/storage';
import { ArrowRight, MoreHorizontal } from 'lucide-react';
import {
  CuteFolderIcon,
  CutePdfRedIcon,
  CuteImgToPdfIcon,
  CuteScissorsIcon,
  CuteTrashIcon,
  CuteOcrIcon,
  CuteMergePdfIcon,
  CuteRobotIcon,
  CuteStarIcon,
  CuteClipboardIcon,
  CutePlusSparkleIcon,
  CuteChartIcon,
  CuteClockIcon,
  CuteMegaphoneIcon,
  CuteOpenBookIcon,
  CuteLightbulbIcon,
  CuteBlueFolderStatIcon,
  CuteWorksheetIcon,
  CuteCheckGreenIcon,
  CutePeopleOrangeIcon,
  CuteCreateTileIcon,
  CuteShuffleIcon,
  CuteCompressIcon,
  CuteGearIcon,
} from '@/components/icons/CuteIcons';

interface WorkItem {
  id: string;
  title: string;
  dateText: string;
  href: string;
}

interface ActivityEntry {
  id: string;
  label: string;
  time: string;
  href: string;
  icon: 'pdf' | 'ocr' | 'ai' | 'shuffle';
}

const POPULAR_TOOLS = [
  {
    label: 'รวม/จัดพิมพ์',
    sub: 'PDF',
    href: '/pdf-tools',
    tileBg: 'bg-[#fff0f3] hover:bg-[#ffe4ea] border-rose-100/80',
    Icon: CutePdfRedIcon,
  },
  {
    label: 'รูปภาพ',
    sub: '→ PDF',
    href: '/file-converter',
    tileBg: 'bg-[#edf7ff] hover:bg-[#dff0ff] border-sky-100/80',
    Icon: CuteImgToPdfIcon,
  },
  {
    label: 'แยกไฟล์',
    sub: 'PDF',
    href: '/file-converter',
    tileBg: 'bg-[#f3efff] hover:bg-[#e9e1ff] border-violet-100/80',
    Icon: CuteScissorsIcon,
  },
  {
    label: 'ลบหน้า',
    sub: 'PDF',
    href: '/pdf-tools',
    tileBg: 'bg-[#fff3ec] hover:bg-[#ffe7da] border-orange-100/80',
    Icon: CuteTrashIcon,
  },
  {
    label: 'OCR',
    sub: 'สแกนข้อความ',
    href: '/ocr-scanner',
    tileBg: 'bg-[#ecfbff] hover:bg-[#dcf6ff] border-cyan-100/80',
    Icon: CuteOcrIcon,
  },
  {
    label: 'รวมไฟล์',
    sub: 'PDF',
    href: '/pdf-tools',
    tileBg: 'bg-[#edfcf3] hover:bg-[#dcf8e8] border-emerald-100/80',
    Icon: CuteMergePdfIcon,
  },
  {
    label: 'AI',
    sub: 'ออกข้อสอบ',
    href: '/questions',
    tileBg: 'bg-[#f0f0ff] hover:bg-[#e4e4ff] border-indigo-100/80',
    Icon: CuteRobotIcon,
  },
];

const DEFAULT_RECENT_WORK: WorkItem[] = [
  {
    id: 'demo-1',
    title: 'ใบงานเรื่อง โครงสร้างข้อมูล (List/Queue).pdf',
    dateText: 'พร้อมใช้งาน • คลิกเพื่อเปิดจัดการใบงาน',
    href: '/worksheets',
  },
  {
    id: 'demo-2',
    title: 'ข้อสอบอาร์เรย์ ชุด A-B-C.pdf',
    dateText: 'พร้อมใช้งาน • คลิกเพื่อสลับข้อสอบ',
    href: '/exam-shuffler',
  },
];

const DEFAULT_ACTIVITIES: ActivityEntry[] = [
  { id: 'act-1', label: 'รวมและจัดพิมพ์ไฟล์ PDF', time: 'พร้อมใช้', href: '/pdf-tools', icon: 'pdf' },
  { id: 'act-2', label: 'สแกนข้อความภาษาไทย (OCR)', time: 'พร้อมใช้', href: '/ocr-scanner', icon: 'ocr' },
  { id: 'act-3', label: 'สร้างข้อสอบด้วย AI อัตโนมัติ', time: 'พร้อมใช้', href: '/questions', icon: 'ai' },
];

function formatThaiDateTime(iso?: string) {
  if (!iso) return 'อัปเดตล่าสุด';
  try {
    const d = new Date(iso);
    return `แก้ไขล่าสุด ${d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    })} ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;
  } catch {
    return 'อัปเดตล่าสุด';
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalFiles: 0,
    worksheets: 0,
    exams: 0,
    lessons: 0,
  });
  const [recentWork, setRecentWork] = useState<WorkItem[]>(DEFAULT_RECENT_WORK);
  const [activities, setActivities] = useState<ActivityEntry[]>(DEFAULT_ACTIVITIES);

  useEffect(() => {
    try {
      const contents = StorageManager.getContents();
      const worksheets = StorageManager.getWorksheets();
      const examBank = StorageManager.getExamBank();
      const questionSets = StorageManager.getQuestionSets();

      const totalExams = examBank.length + questionSets.length;
      const totalFiles = contents.length + worksheets.length + totalExams;

      setStats({
        totalFiles,
        worksheets: worksheets.length,
        exams: totalExams,
        lessons: contents.length,
      });

      const mergedWork: WorkItem[] = [
        ...worksheets.slice(0, 2).map((w) => ({
          id: `ws-${w.id}`,
          title: `${w.title || 'ใบงาน'}.pdf`,
          dateText: formatThaiDateTime(w.createdAt),
          href: '/worksheets',
        })),
        ...examBank.slice(0, 2).map((e) => ({
          id: `ex-${e.id}`,
          title: `${e.title || 'ชุดข้อสอบ'}.pdf`,
          dateText: formatThaiDateTime(e.createdAt),
          href: '/exam-shuffler',
        })),
        ...contents.slice(0, 2).map((c) => ({
          id: `ct-${c.id}`,
          title: c.title || 'เนื้อหาบทเรียน',
          dateText: formatThaiDateTime(c.createdAt),
          href: '/library',
        })),
      ].slice(0, 3);

      if (mergedWork.length > 0) {
        setRecentWork(mergedWork);
      }

      const liveActs: ActivityEntry[] = [];
      if (worksheets[0]) {
        liveActs.push({
          id: `a-ws-${worksheets[0].id}`,
          label: `สร้างใบงาน: ${worksheets[0].title}`,
          time: new Date(worksheets[0].createdAt).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          }) + ' น.',
          href: '/worksheets',
          icon: 'pdf',
        });
      }
      if (examBank[0]) {
        liveActs.push({
          id: `a-ex-${examBank[0].id}`,
          label: `คลังข้อสอบ: ${examBank[0].title}`,
          time: new Date(examBank[0].createdAt).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          }) + ' น.',
          href: '/exam-shuffler',
          icon: 'shuffle',
        });
      }
      if (questionSets[0]) {
        liveActs.push({
          id: `a-qs-${questionSets[0].id}`,
          label: `สร้างข้อสอบด้วย AI (${questionSets[0].questions?.length || 10} ข้อ)`,
          time: new Date(questionSets[0].createdAt).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          }) + ' น.',
          href: `/questions/editor/${questionSets[0].id}`,
          icon: 'ai',
        });
      }
      if (liveActs.length > 0) {
        setActivities(liveActs);
      }
    } catch {
      // Keep friendly defaults
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="หน้าหลัก"
        subtitle="ศูนย์รวมเครื่องมือจัดการไฟล์ PDF, รูปภาพ, OCR, สร้างข้อสอบ และระบบครูผู้สอน"
      />

      <div className="px-5 lg:px-8 pt-6 space-y-6 max-w-[1340px] mx-auto w-full">
        {/* Hero Welcome Banner */}
        <section className="flex flex-col sm:flex-row sm:items-center gap-4 px-2 pt-1">
          <div className="animate-cute-float shrink-0">
            <CuteFolderIcon className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-[0_10px_18px_rgba(245,158,11,0.28)]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm sm:text-base font-bold text-slate-700">ยินดีต้อนรับสู่</p>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Exam &amp; File
              </h1>
              <span className="relative inline-block">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#a855f7] via-[#8b5cf6] to-[#6366f1] bg-clip-text text-transparent">
                  Workbench
                </span>
                {/* Sunny yellow underline */}
                <span className="block h-1.5 w-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 mt-0.5 shadow-2xs" />
                {/* Cute yellow sparkle rays */}
                <svg
                  viewBox="0 0 36 32"
                  fill="none"
                  className="w-8 h-7 absolute -top-3.5 -right-8 pointer-events-none"
                >
                  <path d="M8 22L14 6" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
                  <path d="M16 24L27 12" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
                  <path d="M21 28L31 24" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </div>
            <p className="text-sm font-medium text-slate-600 pt-0.5">
              ระบบคลังข้อสอบและจัดการเอกสารสำหรับครู
            </p>
          </div>
        </section>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT / MAIN COLUMN (8 cols) */}
          <div className="xl:col-span-8 space-y-6">
            {/* 1. Popular Teacher Tools Strip */}
            <section className="cute-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base sm:text-[17px] font-bold text-slate-800 flex items-center gap-2">
                  <CuteStarIcon className="w-6 h-6 shrink-0" />
                  <span>เครื่องมือยอดนิยม (Teacher Tools)</span>
                </h2>
                <Link
                  href="/pdf-tools"
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700 hidden sm:inline-flex items-center gap-1"
                >
                  ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {POPULAR_TOOLS.map((tool) => {
                  const Icon = tool.Icon;
                  return (
                    <Link
                      key={`${tool.label}-${tool.sub}`}
                      href={tool.href}
                      className={`group flex flex-col items-center text-center p-3 rounded-[22px] border transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_12px_22px_-8px_rgba(139,92,246,0.22)] ${tool.tileBg}`}
                    >
                      <div className="w-13 h-13 flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110">
                        <Icon className="w-12 h-12 drop-shadow-[0_4px_6px_rgba(15,23,42,0.12)]" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-800 leading-tight">
                        {tool.label}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 leading-tight mt-0.5">
                        {tool.sub}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* 2. Middle Row: My Work + Create New */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* My Work (Workbench) */}
              <section className="cute-card p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <h2 className="text-base sm:text-[17px] font-bold text-slate-800 flex items-center gap-2">
                    <CuteClipboardIcon className="w-6 h-6 shrink-0" />
                    <span>งานของฉัน (Workbench)</span>
                  </h2>

                  <div className="space-y-2.5">
                    {recentWork.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="group flex items-center gap-3 p-2.5 rounded-2xl hover:bg-sky-50/80 border border-transparent hover:border-sky-100 transition-all"
                      >
                        <CutePdfRedIcon className="w-10 h-10 shrink-0 group-hover:scale-105 transition-transform" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-slate-800 group-hover:text-violet-700 truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.dateText}
                          </p>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-slate-400 group-hover:text-violet-500 shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Link
                    href="/library"
                    className="cute-pill-btn inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold"
                  >
                    <span>ดูงานทั้งหมด</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </section>

              {/* Create New Items */}
              <section className="cute-card p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <h2 className="text-base sm:text-[17px] font-bold text-slate-800 flex items-center gap-2">
                  <CutePlusSparkleIcon className="w-6 h-6 shrink-0" />
                  <span>สร้างรายการใหม่</span>
                </h2>

                <div className="grid grid-cols-3 gap-3 flex-1 items-stretch">
                  <Link
                    href="/worksheets"
                    className="group flex flex-col items-center justify-center text-center p-3.5 rounded-[22px] bg-[#edf6ff] hover:bg-[#e1f1ff] border border-sky-100/90 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    <CuteCreateTileIcon
                      variant="worksheet"
                      className="w-12 h-12 mb-2.5 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[12px] font-bold text-slate-800 leading-tight">
                      สร้างใบงาน
                    </span>
                    <span className="text-[10.5px] font-semibold text-slate-500 mt-0.5">
                      (DOCX / PDF)
                    </span>
                  </Link>

                  <Link
                    href="/exam-shuffler"
                    className="group flex flex-col items-center justify-center text-center p-3.5 rounded-[22px] bg-[#fff7ec] hover:bg-[#ffefd9] border border-amber-100/90 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    <CuteCreateTileIcon
                      variant="exam"
                      className="w-12 h-12 mb-2.5 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[12px] font-bold text-slate-800 leading-tight">
                      สร้างข้อสอบ
                    </span>
                    <span className="text-[10.5px] font-semibold text-slate-500 mt-0.5">
                      สลับ A-B-C
                    </span>
                  </Link>

                  <Link
                    href="/answer-sheet"
                    className="group flex flex-col items-center justify-center text-center p-3.5 rounded-[22px] bg-[#f4efff] hover:bg-[#ebe1ff] border border-violet-100/90 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    <CuteCreateTileIcon
                      variant="answer"
                      className="w-12 h-12 mb-2.5 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[12px] font-bold text-slate-800 leading-tight">
                      สร้างกระดาษ
                    </span>
                    <span className="text-[10.5px] font-semibold text-slate-500 mt-0.5">
                      คำตอบฝน
                    </span>
                  </Link>
                </div>
              </section>
            </div>

            {/* 3. Recommended Tool Banner */}
            <section className="cute-card p-5 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="space-y-2 shrink-0">
                    <h2 className="text-base sm:text-[17px] font-bold text-slate-800 flex items-center gap-2">
                      <CuteMegaphoneIcon className="w-6 h-6 shrink-0" />
                      <span>แนะนำเครื่องมือ</span>
                    </h2>
                    <CuteOpenBookIcon className="w-28 h-20 drop-shadow-sm" />
                  </div>

                  <div className="flex items-start gap-3 sm:pl-2">
                    <CuteLightbulbIcon className="w-12 h-12 shrink-0 drop-shadow-sm" />
                    <div className="space-y-1">
                      <h3 className="text-lg font-extrabold text-slate-900">
                        OCR สแกนข้อความ
                      </h3>
                      <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed max-w-md">
                        แปลงข้อความจากภาพหรือ PDF ให้เป็นข้อความที่แก้ไขได้ สระและวรรณยุกต์ภาษาไทยแม่นยำสูง ไม่ลอย ไม่เพี้ยน
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/ocr-scanner"
                  className="cute-pill-btn inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold shrink-0"
                >
                  <span>ลองใช้เลย</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN (4 cols) */}
          <div className="xl:col-span-4 space-y-6">
            {/* 1. Usage Overview Stats */}
            <section className="cute-card p-5 sm:p-6 space-y-4">
              <h2 className="text-base sm:text-[17px] font-bold text-slate-800 flex items-center gap-2">
                <CuteChartIcon className="w-6 h-6 shrink-0" />
                <span>สรุปภาพรวมการใช้งาน</span>
              </h2>

              <div className="grid grid-cols-2 gap-3.5">
                <Link
                  href="/library"
                  className="group p-3.5 rounded-[22px] bg-[#edf7ff] hover:bg-[#e1f1ff] border border-sky-100/90 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                >
                  <CuteBlueFolderStatIcon className="w-10 h-10 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold text-slate-600 truncate">ไฟล์ทั้งหมด</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-tight">
                      {stats.totalFiles}
                    </p>
                  </div>
                </Link>

                <Link
                  href="/worksheets"
                  className="group p-3.5 rounded-[22px] bg-[#f4f1ff] hover:bg-[#eae4ff] border border-violet-100/90 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                >
                  <CuteWorksheetIcon className="w-10 h-10 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold text-slate-600 truncate">ใบงาน</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-tight">
                      {stats.worksheets}
                    </p>
                  </div>
                </Link>

                <Link
                  href="/exam-shuffler"
                  className="group p-3.5 rounded-[22px] bg-[#edfcf3] hover:bg-[#dcf8e8] border border-emerald-100/90 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                >
                  <CuteCheckGreenIcon className="w-10 h-10 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold text-slate-600 truncate">ข้อสอบ</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-tight">
                      {stats.exams}
                    </p>
                  </div>
                </Link>

                <Link
                  href="/library"
                  className="group p-3.5 rounded-[22px] bg-[#fff5eb] hover:bg-[#ffead6] border border-orange-100/90 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                >
                  <CutePeopleOrangeIcon className="w-10 h-10 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold text-slate-600 truncate">บทเรียน</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-tight">
                      {stats.lessons}
                    </p>
                  </div>
                </Link>
              </div>
            </section>

            {/* 2. Recent Activity */}
            <section className="cute-card p-5 sm:p-6 space-y-4">
              <h2 className="text-base sm:text-[17px] font-bold text-slate-800 flex items-center gap-2">
                <CuteClockIcon className="w-6 h-6 shrink-0" />
                <span>กิจกรรมล่าสุด</span>
              </h2>

              <div className="space-y-2.5">
                {activities.map((act) => (
                  <Link
                    key={act.id}
                    href={act.href}
                    className="group flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-violet-50/70 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {act.icon === 'pdf' && <CutePdfRedIcon className="w-9 h-9 shrink-0" />}
                      {act.icon === 'ocr' && <CuteOcrIcon className="w-9 h-9 shrink-0" />}
                      {act.icon === 'ai' && <CuteRobotIcon className="w-9 h-9 shrink-0" />}
                      {act.icon === 'shuffle' && <CuteShuffleIcon className="w-9 h-9 shrink-0" />}
                      <span className="text-[13px] font-bold text-slate-700 group-hover:text-violet-700 truncate">
                        {act.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                      {act.time}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* 3. Quick Utility Shortcuts */}
            <section className="cute-card p-4 space-y-3">
              <p className="text-xs font-bold text-slate-600 px-1">ทางลัดเครื่องมือเสริม ✨</p>
              <div className="grid grid-cols-3 gap-2.5">
                <Link
                  href="/exam-shuffler"
                  className="group flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-sky-50/80 hover:bg-sky-100/70 transition text-center"
                >
                  <CuteShuffleIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-slate-700 leading-tight">สลับข้อสอบ</span>
                </Link>
                <Link
                  href="/pdf-tools"
                  className="group flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-orange-50/80 hover:bg-orange-100/70 transition text-center"
                >
                  <CuteCompressIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-slate-700 leading-tight">บีบอัด PDF</span>
                </Link>
                <Link
                  href="/settings"
                  className="group flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100/70 transition text-center"
                >
                  <CuteGearIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-slate-700 leading-tight">ตั้งค่าระบบ</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
