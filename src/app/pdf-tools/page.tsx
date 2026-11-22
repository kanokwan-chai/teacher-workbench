'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PdfMerger } from '@/components/pdftools/PdfMerger';
import { PrintFormatter } from '@/components/pdftools/PrintFormatter';
import { PdfCompressor } from '@/components/pdftools/PdfCompressor';
import { PdfNameSplitter } from '@/components/pdftools/PdfNameSplitter';
import { PdfPageDeleter } from '@/components/pdftools/PdfPageDeleter';
import {
  CuteScissorsIcon,
  CuteMergePdfIcon,
  CuteTrashIcon,
  CutePrinterIcon,
  CuteCompressIcon,
} from '@/components/icons/CuteIcons';

export default function PdfToolsPage() {
  const [activeTab, setActiveTab] = useState<'split' | 'merge' | 'delete' | 'print' | 'compress'>('split');

  const tabs = [
    {
      id: 'split' as const,
      label: 'แยก PDF ตามชื่อบุคคล',
      Icon: CuteScissorsIcon,
      activeClass: 'bg-gradient-to-r from-[#a77dff] to-[#8b5cf6] text-white shadow-[0_6px_16px_rgba(139,92,246,0.35)]',
    },
    {
      id: 'merge' as const,
      label: 'รวมไฟล์ PDF',
      Icon: CuteMergePdfIcon,
      activeClass: 'bg-gradient-to-r from-[#34d399] to-[#10b981] text-white shadow-[0_6px_16px_rgba(16,185,129,0.35)]',
    },
    {
      id: 'delete' as const,
      label: 'ลบหน้า PDF',
      Icon: CuteTrashIcon,
      activeClass: 'bg-gradient-to-r from-[#fb7185] to-[#e11d48] text-white shadow-[0_6px_16px_rgba(225,29,72,0.35)]',
    },
    {
      id: 'print' as const,
      label: 'พิมพ์พร้อมใช้',
      Icon: CutePrinterIcon,
      activeClass: 'bg-gradient-to-r from-[#38bdf8] to-[#0284c7] text-white shadow-[0_6px_16px_rgba(14,165,233,0.35)]',
    },
    {
      id: 'compress' as const,
      label: 'บีบอัด PDF',
      Icon: CuteCompressIcon,
      activeClass: 'bg-gradient-to-r from-[#fb923c] to-[#ea580c] text-white shadow-[0_6px_16px_rgba(234,88,12,0.35)]',
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-12">
      <Header
        title="เครื่องมือจัดการ PDF"
        subtitle="แยก PDF รายบุคคลตามชื่อ-นามสกุลอัตโนมัติ, รวมไฟล์ PDF, ลบหน้า PDF, ปรับแต่งสำหรับพิมพ์ และบีบอัดขนาดไฟล์"
      />

      <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
        {/* Cute Pastel Pill Tabs Navigation */}
        <div className="cute-card p-2 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.Icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-[13px] transition-all duration-200 ${
                  isActive
                    ? tab.activeClass
                    : 'text-slate-600 hover:text-violet-700 hover:bg-sky-50/90'
                }`}
              >
                <span className={`w-6 h-6 flex items-center justify-center rounded-lg ${isActive ? 'bg-white/25' : ''}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="transition-all duration-200">
          {activeTab === 'split' && <PdfNameSplitter />}
          {activeTab === 'merge' && <PdfMerger />}
          {activeTab === 'delete' && <PdfPageDeleter />}
          {activeTab === 'print' && <PrintFormatter />}
          {activeTab === 'compress' && <PdfCompressor />}
        </div>
      </div>
    </div>
  );
}
