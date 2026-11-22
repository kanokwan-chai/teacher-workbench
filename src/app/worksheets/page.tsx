'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { StorageManager } from '@/lib/storage';
import { ContentProfile, Worksheet, WorksheetSection } from '@/types';
import { generateWorksheetDocx } from '@/lib/exporters';
import {
  FileText,
  Sparkles,
  Plus,
  Download,
  Printer,
  Trash2,
  Code,
  Columns,
  Eye,
  Wand2,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

const SAMPLE_RAW_QUESTIONS = `ตอนที่ 1: การจัดการข้อมูลแบบลิสต์ (List) ในภาษา Python
พิจารณารหัสโปรแกรมต่อไปนี้ แล้วตอบคำถามข้อย่อยให้ถูกต้อง
activity = ["ร้องเพลง", "เต้น", "วาดภาพ", "เล่นดนตรี", "กีฬา"]
1. ผลลัพธ์หลังจาก activity[1] =
2. ผลลัพธ์หลังจาก activity.append("เล่านิทาน") =
3. ผลลัพธ์หลังจาก activity.insert(2, "รำไทย") =
4. ผลลัพธ์หลังจาก print(len(activity)) =
5. ผลลัพธ์หลังจาก activity.remove("เต้น") =
6. ผลลัพธ์หลังจาก activity.pop(3) =
7. คำสั่ง append() คืออะไร =
8. คำสั่ง insert() คืออะไร =
9. คำสั่ง remove() คืออะไร =
10. คำสั่ง pop() คืออะไร =

ตอนที่ 2: คำถามวิเคราะห์และเขียนอธิบาย
1. จงอธิบายความแตกต่างระหว่างการใช้คำสั่ง remove() และ pop() ในการลบข้อมูลออกจาก List พร้อมยกตัวอย่างประกอบ
2. หากต้องการเก็บข้อมูลคะแนนสอบวิชาคอมพิวเตอร์ของนักเรียน 30 คน นักเรียนจะเลือกใช้โครงสร้างข้อมูลแบบใด เพราะเหตุใด`;

function WorksheetGeneratorContent() {
  const searchParams = useSearchParams();
  const profileIdParam = searchParams.get('profileId');
  const printRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<'paste' | 'profile'>('paste');
  const [profiles, setProfiles] = useState<ContentProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  // Metadata fields
  const [schoolName, setSchoolName] = useState<string>('โรงเรียนมัธยมศึกษา');
  const [title, setTitle] = useState<string>('ใบงาน เรื่อง การจัดการข้อมูลและโครงสร้างข้อมูล');
  const [subject, setSubject] = useState<string>('วิทยาการคำนวณ (คอมพิวเตอร์)');
  const [gradeLevel, setGradeLevel] = useState<string>('ม.4');
  const [teacherName, setTeacherName] = useState<string>('');
  const [worksheetType, setWorksheetType] = useState<string>('worksheet');
  const [totalScore, setTotalScore] = useState<number>(20);
  const [timeMinutes, setTimeMinutes] = useState<number>(50);
  const [paperColumns, setPaperColumns] = useState<1 | 2>(1);
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);

  // Raw text input for formatting
  const [rawText, setRawText] = useState<string>(SAMPLE_RAW_QUESTIONS);

  const [generatedWorksheet, setGeneratedWorksheet] = useState<Worksheet | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  useEffect(() => {
    const list = StorageManager.getProfiles();
    setProfiles(list);
    if (profileIdParam && list.some((p) => p.id === profileIdParam)) {
      setSelectedProfileId(profileIdParam);
      setMode('profile');
    } else if (list.length > 0) {
      setSelectedProfileId(list[0].id);
    }
  }, [profileIdParam]);

  const handleFormatRawWithAI = async () => {
    if (!rawText.trim()) return;
    setIsGenerating(true);
    setStatusBanner(null);
    try {
      const res = await fetch('/api/generate-worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          title,
          subject,
          gradeLevel,
          schoolName,
          teacherName,
          worksheetType,
          totalScore,
          timeMinutes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        StorageManager.saveWorksheet(data);
        setGeneratedWorksheet(data);
        if (data._quotaWarning) {
          setStatusBanner(`จัดรูปแบบใบงานด้วยระบบอัตโนมัติเรียบร้อยแล้ว (หมายเหตุ: ${data._quotaWarning})`);
        } else {
          setStatusBanner('✨ จัดรูปแบบใบงานเรียบร้อยแล้ว! สามารถแก้ไขข้อความหรือกดดาวน์โหลดเป็นไฟล์ Word (.docx) และ PDF (.pdf) ได้ทันที');
        }
      } else {
        setStatusBanner(data.error || 'เกิดข้อผิดพลาดในการจัดใบงาน');
      }
    } catch (e: any) {
      console.error(e);
      setStatusBanner('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromProfile = async () => {
    const targetProfile = profiles.find((p) => p.id === selectedProfileId);
    if (!targetProfile) return;

    setIsGenerating(true);
    setStatusBanner(null);
    try {
      const res = await fetch('/api/generate-worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: targetProfile,
          worksheetType,
          totalScore,
          timeMinutes,
        }),
      });

      if (res.ok) {
        const ws = await res.json();
        const enriched: Worksheet = {
          ...ws,
          schoolName,
          teacherName,
        };
        StorageManager.saveWorksheet(enriched);
        setGeneratedWorksheet(enriched);
        setStatusBanner('✨ สร้างใบงานจากบทเรียนเรียบร้อยแล้ว!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadDocx = async (withKey: boolean) => {
    if (!generatedWorksheet) return;
    setIsExportingDocx(true);
    try {
      const wsToExport: Worksheet = {
        ...generatedWorksheet,
        schoolName,
        teacherName,
        title: generatedWorksheet.title || title,
        subject: generatedWorksheet.subject || subject,
        gradeLevel: generatedWorksheet.gradeLevel || gradeLevel,
      };
      const blob = await generateWorksheetDocx(wsToExport, withKey);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (wsToExport.title || 'ใบงาน').replace(/[\\/:*?"<>|]/g, '_');
      a.download = `${safeTitle}${withKey ? '_เฉลยครู' : ''}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('DOCX export error:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ .docx');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadPdfDirect = async () => {
    if (!printRef.current || !generatedWorksheet) return;
    setIsExportingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 5) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const safeTitle = (generatedWorksheet.title || 'ใบงาน').replace(/[\\/:*?"<>|]/g, '_');
      pdf.save(`${safeTitle}${showAnswerKey ? '_เฉลยครู' : ''}.pdf`);
    } catch (err) {
      console.error('Direct PDF export fallback to window.print():', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const updateSection = (secIdx: number, patch: Partial<WorksheetSection>) => {
    if (!generatedWorksheet) return;
    const nextSections = generatedWorksheet.sections.map((s, i) => (i === secIdx ? { ...s, ...patch } : s));
    setGeneratedWorksheet({ ...generatedWorksheet, sections: nextSections });
  };

  const addQuestionToSection = (secIdx: number) => {
    if (!generatedWorksheet) return;
    const sec = generatedWorksheet.sections[secIdx];
    const nextNum = sec.questions.length + 1;
    const nextQuestions = [
      ...sec.questions,
      {
        number: nextNum,
        question: `คำถามข้อที่ ${nextNum}`,
        spaceType: 'lines' as const,
        linesCount: 3,
        score: 2,
      },
    ];
    updateSection(secIdx, { questions: nextQuestions });
  };

  const addNewSection = () => {
    if (!generatedWorksheet) return;
    const nextIdx = generatedWorksheet.sections.length + 1;
    setGeneratedWorksheet({
      ...generatedWorksheet,
      sections: [
        ...generatedWorksheet.sections,
        {
          title: `ตอนที่ ${nextIdx}: คำถามเพิ่มเติม`,
          instructions: 'จงตอบคำถามต่อไปนี้ให้ถูกต้อง',
          questions: [
            {
              number: 1,
              question: 'จงอธิบาย...',
              spaceType: 'lines',
              linesCount: 3,
              score: 5,
            },
          ],
        },
      ],
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Control Panel (Hidden when printing) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-brand-600" />
              ระบบจัดรูปแบบใบงานอัตโนมัติ (ส่งออกไฟล์ Word .DOCX และ .PDF)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              วางโจทย์ที่คุณมี (ทั้งโจทย์ถาม-ตอบ โจทย์โค้ดโปรแกรม หรือข้อย่อย) แล้วให้ระบบจัดหน้าใบงานพร้อมดาวน์โหลดเป็นไฟล์ .docx และ .pdf ทันที
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('paste')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                mode === 'paste' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 วางโจทย์เพื่อจัดใบงาน
            </button>
            <button
              type="button"
              onClick={() => setMode('profile')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                mode === 'profile' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 inline mr-1" />
              สร้างจากคลังบทเรียน
            </button>
          </div>
        </div>

        {/* Common Header Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1">ชื่อใบงาน / เรื่อง</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (generatedWorksheet) setGeneratedWorksheet({ ...generatedWorksheet, title: e.target.value });
              }}
              placeholder="เช่น ใบงานที่ 1 เรื่อง โครงสร้างข้อมูลแบบแถวลำดับ"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block mb-1">รายวิชา</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (generatedWorksheet) setGeneratedWorksheet({ ...generatedWorksheet, subject: e.target.value });
              }}
              placeholder="เช่น วิทยาการคำนวณ"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block mb-1">ระดับชั้น</label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => {
                  setGradeLevel(e.target.value);
                  if (generatedWorksheet) setGeneratedWorksheet({ ...generatedWorksheet, gradeLevel: e.target.value });
                }}
                placeholder="เช่น ม.4"
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block mb-1">โรงเรียน</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => {
                  setSchoolName(e.target.value);
                  if (generatedWorksheet) setGeneratedWorksheet({ ...generatedWorksheet, schoolName: e.target.value });
                }}
                placeholder="ชื่อโรงเรียน (ถ้ามี)"
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1">ครูผู้สอน (ไม่บังคับ)</label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => {
                setTeacherName(e.target.value);
                if (generatedWorksheet) setGeneratedWorksheet({ ...generatedWorksheet, teacherName: e.target.value });
              }}
              placeholder="เช่น ครูสมศรี ใจดี"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block mb-1">คะแนนเต็ม ({totalScore} คะแนน)</label>
            <input
              type="number"
              value={totalScore}
              onChange={(e) => {
                const v = Number(e.target.value);
                setTotalScore(v);
                if (generatedWorksheet) setGeneratedWorksheet({ ...generatedWorksheet, totalScore: v });
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block mb-1">เวลาทำ ({timeMinutes} นาที)</label>
            <input
              type="number"
              value={timeMinutes}
              onChange={(e) => {
                const v = Number(e.target.value);
                setTimeMinutes(v);
                if (generatedWorksheet) setGeneratedWorksheet({ ...generatedWorksheet, timeMinutes: v });
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block mb-1">การจัดคอลัมน์กระดาษ</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setPaperColumns(1)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition ${
                  paperColumns === 1
                    ? 'bg-brand-50 border-brand-500 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                📄 1 คอลัมน์
              </button>
              <button
                type="button"
                onClick={() => setPaperColumns(2)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition ${
                  paperColumns === 2
                    ? 'bg-brand-50 border-brand-500 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Columns className="w-3.5 h-3.5 inline mr-1" /> 2 คอลัมน์
              </button>
            </div>
          </div>
        </div>

        {mode === 'paste' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                📝 วางโจทย์ที่ต้องการให้จัดเป็นใบงาน (คัดลอกโจทย์มาวางได้เลย รองรับทั้งโจทย์ทั่วไป โค้ดโปรแกรม และข้อย่อย)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_RAW_QUESTIONS)}
                  className="text-[11px] font-semibold text-brand-600 hover:underline"
                >
                  โหลดตัวอย่างโจทย์ใบงาน
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setRawText('')}
                  className="text-[11px] font-semibold text-rose-600 hover:underline"
                >
                  ล้างข้อความ
                </button>
              </div>
            </div>
            <textarea
              rows={9}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`วางโจทย์ของคุณที่นี่ เช่น:\nตอนที่ 1: คำถามจากโค้ดโปรแกรม\nactivity = ["ร้องเพลง", "เต้น", "วาดภาพ"]\n1. ผลลัพธ์หลังจาก activity[1] =\n2. ผลลัพธ์หลังจาก activity.append("เล่านิทาน") =\n\nตอนที่ 2: จงอธิบาย...\n1. คำสั่ง append() ทำหน้าที่อะไร`}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-mono leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />

            <button
              type="button"
              onClick={handleFormatRawWithAI}
              disabled={isGenerating || !rawText.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-md disabled:opacity-50 transition cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังจัดระเบียบใบงานและเตรียมไฟล์ DOCX / PDF...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>✨ จัดรูปแบบใบงานให้เรียบร้อย (พร้อมส่งออก DOCX และ PDF)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">เลือกบทเรียน (Content Profile)</label>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-semibold"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.subject}] {p.topic}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleGenerateFromProfile}
              disabled={isGenerating || profiles.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-sm disabled:opacity-50 transition"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>[ 📄 สร้างใบงานจากบทเรียนด้วย AI ]</span>
                </>
              )}
            </button>
          </div>
        )}

        {statusBanner && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusBanner}</span>
          </div>
        )}
      </div>

      {/* Export Action Bar & Editable Worksheet Preview */}
      {generatedWorksheet && (
        <div className="space-y-4">
          {/* Sticky Export Bar */}
          <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold">ใบงานพร้อมดาวน์โหลดแล้ว!</h4>
                <p className="text-[11px] text-slate-300">
                  เลือกดาวน์โหลดเป็นไฟล์ Word (.docx) เพื่อแก้ไขต่อใน Microsoft Word หรือดาวน์โหลดเป็น PDF (.pdf)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  showAnswerKey
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                {showAnswerKey ? 'กำลังแสดงเฉลยครู' : 'ดูเฉลยครู'}
              </button>

              <button
                type="button"
                onClick={() => handleDownloadDocx(false)}
                disabled={isExportingDocx}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลด Word (.docx)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadDocx(true)}
                disabled={isExportingDocx}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Word ฉบับเฉลย (.docx)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdfDirect}
                disabled={isExportingPdf}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingPdf ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF (.pdf)'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>สั่งพิมพ์ / บันทึก PDF</span>
              </button>
            </div>
          </div>

          {/* Printable / Editable A4 Worksheet Sheet */}
          <div
            ref={printRef}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 md:p-10 print:p-0 print:border-none print:shadow-none print:rounded-none space-y-5 text-slate-900"
          >
            {/* Worksheet Formal Header */}
            <div className="border-b-2 border-slate-800 pb-4 space-y-2">
              {schoolName && (
                <p className="text-center text-sm font-bold text-slate-700">{schoolName}</p>
              )}
              <h2 className="text-center text-lg md:text-xl font-extrabold text-slate-900">
                {generatedWorksheet.title || title}
                {showAnswerKey && (
                  <span className="ml-2 text-rose-600 text-sm font-bold">(ฉบับเฉลยครู)</span>
                )}
              </h2>
              <p className="text-center text-xs font-semibold text-slate-600">
                รายวิชา: {generatedWorksheet.subject || subject} | ระดับชั้น: {generatedWorksheet.gradeLevel || gradeLevel} | คะแนนเต็ม: {generatedWorksheet.totalScore} คะแนน | เวลา: {generatedWorksheet.timeMinutes} นาที
                {teacherName ? ` | ครูผู้สอน: ${teacherName}` : ''}
              </p>

              {/* Student Name Line */}
              <div className="pt-2 text-xs font-semibold text-slate-800 flex flex-wrap justify-between gap-2">
                <span>ชื่อ-นามสกุล: .....................................................................................</span>
                <span>ชั้น: ..........................</span>
                <span>เลขที่: .................</span>
                <span>คะแนนที่ได้: ............ / {generatedWorksheet.totalScore}</span>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {generatedWorksheet.sections.map((sec, secIdx) => (
                <div key={secIdx} className="space-y-3">
                  {/* Section Title Box */}
                  <div className="bg-slate-100 print:bg-slate-100 border-l-4 border-slate-900 px-3.5 py-2 rounded-r-xl flex items-start justify-between gap-2">
                    <div className="space-y-0.5 flex-1">
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => updateSection(secIdx, { title: e.target.value })}
                        className="font-bold text-sm text-slate-900 bg-transparent w-full focus:outline-none focus:underline"
                      />
                      <input
                        type="text"
                        value={sec.instructions}
                        onChange={(e) => updateSection(secIdx, { instructions: e.target.value })}
                        className="text-xs text-slate-600 italic bg-transparent w-full focus:outline-none focus:underline"
                      />
                    </div>
                  </div>

                  {/* Questions List (1 or 2 columns) */}
                  <div
                    className={
                      paperColumns === 2
                        ? 'columns-1 md:columns-2 print:columns-2 gap-6 [column-rule:1px_solid_#cbd5e1] space-y-4'
                        : 'space-y-5'
                    }
                  >
                    {sec.questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="break-inside-avoid-column space-y-2 text-xs text-slate-800 pl-1"
                      >
                        {/* Question Stem */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-slate-900 leading-relaxed flex-1">
                            <span>{q.number}. </span>
                            <span>{q.question}</span>
                            <span className="text-[11px] font-semibold text-slate-500 ml-1.5">
                              ({q.score} คะแนน)
                            </span>
                          </div>
                        </div>

                        {/* Optional Code Block */}
                        {q.codeSnippet && (
                          <pre className="bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-[11px] text-slate-900 overflow-x-auto leading-relaxed">
                            {q.codeSnippet}
                          </pre>
                        )}

                        {/* Sub-items if present (e.g. coding output / fill-in list) */}
                        {q.subItems && q.subItems.length > 0 ? (
                          <div className="space-y-2.5 pl-2 pt-1">
                            {q.subItems.map((sub, sIdx) => (
                              <div key={sIdx} className="space-y-1">
                                <div className="font-semibold text-slate-800">
                                  {sIdx + 1}) <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{sub.label}</code>
                                </div>
                                <div className="pl-4 flex items-end gap-1.5">
                                  <span className="font-semibold text-slate-600 shrink-0">ตอบ =</span>
                                  {showAnswerKey && sub.answer ? (
                                    <span className="font-bold text-rose-600 border-b border-dotted border-slate-500 flex-1 pb-0.5 px-2">
                                      {sub.answer}
                                    </span>
                                  ) : (
                                    <div className="border-b border-dotted border-slate-500 flex-1 h-5" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            {/* Standard Answer Space */}
                            {q.spaceType === 'lines' && (
                              <div className="space-y-3 pt-1 pl-3">
                                {showAnswerKey && q.answerKey ? (
                                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                                    เฉลย: {q.answerKey}
                                  </div>
                                ) : (
                                  Array.from({ length: q.linesCount || 3 }).map((_, lineIdx) => (
                                    <div
                                      key={lineIdx}
                                      className="border-b border-dotted border-slate-400 h-5 flex items-end"
                                    >
                                      {lineIdx === 0 && (
                                        <span className="text-[11px] font-semibold text-slate-500 pr-2">
                                          ตอบ
                                        </span>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}

                            {q.spaceType === 'box' && (
                              <div className="border border-slate-300 rounded-xl min-h-24 p-3 bg-slate-50/30">
                                {showAnswerKey && q.answerKey ? (
                                  <p className="text-rose-700 font-semibold">เฉลย: {q.answerKey}</p>
                                ) : (
                                  <p className="text-[10px] text-slate-400">พื้นที่แสดงวิธีทำ / วาดแผนภาพ</p>
                                )}
                              </div>
                            )}

                            {q.spaceType === 'blank' && showAnswerKey && q.answerKey && (
                              <div className="p-2 rounded-lg bg-rose-50 text-rose-700 font-semibold">
                                เฉลย: {q.answerKey}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Quick button to add a question to this section (hidden in print) */}
                  <div className="pt-1 print:hidden">
                    <button
                      type="button"
                      onClick={() => addQuestionToSection(secIdx)}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-800 inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> เพิ่มข้อคำถามในตอนนี้
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new section button (hidden in print) */}
            <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-center print:hidden">
              <button
                type="button"
                onClick={addNewSection}
                className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มตอนใหม่ (เช่น ตอนที่ {generatedWorksheet.sections.length + 1})
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadDocx(false)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> ดาวน์โหลด .DOCX
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdfDirect}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> ดาวน์โหลด .PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorksheetGeneratorPage() {
  return (
    <div className="flex-1 flex flex-col pb-16">
      <div className="print:hidden">
        <Header
          title="📝 จัดรูปแบบใบงาน & แบบฝึกหัดอัตโนมัติ (DOCX / PDF)"
          subtitle="วางโจทย์ที่คุณมี แล้วให้ระบบจัดหน้าเป็นใบงานที่สวยงาม พร้อมดาวน์โหลดเป็นไฟล์ Word (.docx) และ PDF (.pdf)"
        />
      </div>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">กำลังโหลด...</div>}>
        <WorksheetGeneratorContent />
      </Suspense>
    </div>
  );
}
