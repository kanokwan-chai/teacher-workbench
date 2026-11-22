'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { StorageManager } from '@/lib/storage';
import { QuestionSet } from '@/types';
import { generateQuestionSetDocx, generateQuestionSetPdf } from '@/lib/exporters';
import {
  Download,
  FileText,
  CheckCircle2,
  Layout,
  Printer,
  Sparkles,
} from 'lucide-react';

function ExportCenterContent() {
  const searchParams = useSearchParams();
  const qsIdParam = searchParams.get('qsId');

  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [selectedQsId, setSelectedQsId] = useState<string>('');
  const [exportMode, setExportMode] = useState<'exam' | 'key' | 'answer_sheet' | 'exam_and_key'>('exam');
  const [exportFormat, setExportFormat] = useState<'docx' | 'pdf'>('docx');
  const [template, setTemplate] = useState<'professional' | 'simple' | 'academic' | 'classroom' | 'examination'>('professional');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    const list = StorageManager.getQuestionSets();
    setQuestionSets(list);
    if (qsIdParam && list.some((q) => q.id === qsIdParam)) {
      setSelectedQsId(qsIdParam);
    } else if (list.length > 0) {
      setSelectedQsId(list[0].id);
    }
  }, [qsIdParam]);

  const activeQs = questionSets.find((q) => q.id === selectedQsId);

  const handleExport = async () => {
    if (!activeQs) return;
    setIsExporting(true);

    try {
      if (exportFormat === 'docx') {
        const blob = await generateQuestionSetDocx(activeQs, exportMode);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeQs.title}_${exportMode}.docx`;
        a.click();
      } else {
        generateQuestionSetPdf(activeQs, exportMode);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Select Target Question Set */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-600" /> เลือกรายการที่ต้องการส่งออก
        </h3>

        {questionSets.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">ยังไม่มีชุดข้อสอบในระบบ</p>
        ) : (
          <select
            value={selectedQsId}
            onChange={(e) => setSelectedQsId(e.target.value)}
            className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            {questionSets.map((qs) => (
              <option key={qs.id} value={qs.id}>
                [{qs.subject}] {qs.title} ({qs.totalQuestions} ข้อ)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Configuration Options */}
      {activeQs && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layout className="w-4 h-4 text-purpleBrand-600" /> รูปแบบและประเภทการ Export
          </h3>

          {/* Export Mode */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">รูปแบบเอกสารที่ต้องการ</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold">
              {[
                { mode: 'exam', label: '📄 ชุดข้อสอบ (สำหรับนักเรียน)' },
                { mode: 'key', label: '🔑 เฉลยละเอียด (สำหรับครู)' },
                { mode: 'answer_sheet', label: '📝 กระดาษคำตอบ' },
                { mode: 'exam_and_key', label: '📚 ข้อสอบ + เฉลย' },
              ].map((item) => (
                <button
                  key={item.mode}
                  onClick={() => setExportMode(item.mode as any)}
                  className={`p-3 rounded-2xl border transition text-left ${
                    exportMode === item.mode
                      ? 'bg-purpleBrand-50 border-purpleBrand-400 text-purpleBrand-900 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* File Format Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">ฟอร์แมตไฟล์</label>
              <div className="flex gap-3">
                {[
                  { fmt: 'docx', label: 'DOCX (Microsoft Word)' },
                  { fmt: 'pdf', label: 'PDF (พร้อมพิมพ์)' },
                ].map((f) => (
                  <button
                    key={f.fmt}
                    onClick={() => setExportFormat(f.fmt as any)}
                    className={`flex-1 p-3 rounded-2xl text-xs font-bold border transition ${
                      exportFormat === f.fmt
                        ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Style */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">ธีมรูปแบบเอกสาร (Template)</label>
              <select
                value={template}
                onChange={(e: any) => setTemplate(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="professional">1. Professional (ทางการ ปรับขอบมาตรฐาน)</option>
                <option value="simple">2. Simple (เรียบง่าย สบายตา)</option>
                <option value="academic">3. Academic (เชิงวิชาการ)</option>
                <option value="classroom">4. Classroom (น่ารัก เป็นกันเอง)</option>
                <option value="examination">5. Examination (ข้อสอบมาตรฐานโรงเรียน)</option>
              </select>
            </div>
          </div>

          {/* Download Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-brand-600 to-purpleBrand-600 text-white font-bold text-sm rounded-2xl shadow-md hover:opacity-95 disabled:opacity-50 transition"
            >
              {isExporting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>[ ดาวน์โหลดไฟล์ {exportFormat.toUpperCase()} ]</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExportCenterPage() {
  return (
    <div className="flex-1 flex flex-col pb-16">
      <Header
        title="📦 Export Center (ศูนย์ส่งออกเอกสาร)"
        subtitle="ส่งออกข้อสอบ เฉลย กระดาษคำตอบ ใบงาน ในรูปแบบ PDF และ DOCX พร้อมจัดรูปแบบสละสลวย"
      />
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">กำลังโหลด...</div>}>
        <ExportCenterContent />
      </Suspense>
    </div>
  );
}
