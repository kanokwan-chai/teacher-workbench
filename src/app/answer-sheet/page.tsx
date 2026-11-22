'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { StorageManager } from '@/lib/storage';
import { ExamBankItem } from '@/types';
import {
  FileText,
  Printer,
  Upload,
  X,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  Maximize2,
  Key,
  Type,
  Sliders,
  FolderDown,
} from 'lucide-react';

export default function AnswerSheetGeneratorPage() {
  // Custom Header Information
  const [schoolName, setSchoolName] = useState('โรงเรียนสาธิตการศึกษา');
  const [examTitle, setExamTitle] = useState('แบบทดสอบวัดผลสัมฤทธิ์ทางการเรียน');
  const [subject, setSubject] = useState('วิชา วิทยาศาสตร์และเทคโนโลยี (ว21101)');
  const [teacherName, setTeacherName] = useState('ครูผู้สอน: ครูสมชาย ใจดี');
  const [timeAllowed, setTimeAllowed] = useState('เวลาในการทำ: 60 นาที');
  const [instructions, setInstructions] = useState(
    'คำชี้แจง: ให้ทำเครื่องหมายกากบาท (X) หรือฝนทับตัวเลือกที่ถูกต้องเพียงข้อเดียวลงในช่องคำตอบ'
  );
  const [logoImage, setLogoImage] = useState<string | null>(null);

  // Grid Config
  const [markType, setMarkType] = useState<'cross' | 'bubble'>('cross');
  const [boxSizeChoice, setBoxSizeChoice] = useState<'medium' | 'large' | 'xlarge'>('large');
  const [totalQuestions, setTotalQuestions] = useState<number>(30);
  const [optionCount, setOptionCount] = useState<4 | 5>(4);
  const [optionStyle, setOptionStyle] = useState<'thai' | 'english'>('thai');

  // Teacher Answer Key & Typography Config
  const [isAnswerKeyMode, setIsAnswerKeyMode] = useState<boolean>(false);
  const [selectedVersionKey, setSelectedVersionKey] = useState<string>('A');
  const [fontFamily, setFontFamily] = useState<'Sarabun' | 'Prompt' | 'Kanit'>('Sarabun');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');
  const [examBankList, setExamBankList] = useState<ExamBankItem[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [customKeyAnswers, setCustomKeyAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    setExamBankList(StorageManager.getExamBank());
  }, []);

  const handleSelectBankItem = (bankId: string) => {
    setSelectedBankId(bankId);
    if (!bankId) return;
    const item = StorageManager.getExamBankById(bankId);
    if (item) {
      if (item.title) setExamTitle(item.title);
      if (item.subject) setSubject(item.subject);
      if (item.headerConfig?.schoolName) setSchoolName(item.headerConfig.schoolName);
      if (item.headerConfig?.teacherName) setTeacherName(item.headerConfig.teacherName);
      if (item.headerConfig?.examTime) setTimeAllowed(item.headerConfig.examTime);
      if (item.headerConfig?.instructionText) setInstructions(item.headerConfig.instructionText);
      if (item.headerConfig?.logoUrl) setLogoImage(item.headerConfig.logoUrl);
      if (item.questionsCount) setTotalQuestions(item.questionsCount);

      const keyMap: Record<number, number> = {};
      item.questions.forEach((q, idx) => {
        keyMap[idx + 1] = q.answerIndex;
      });
      setCustomKeyAnswers(keyMap);
      setIsAnswerKeyMode(true);
    }
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoImage(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const CHOICE_LABELS_THAI = ['ก', 'ข', 'ค', 'ง', 'จ'];
  const CHOICE_LABELS_ENG = ['A', 'B', 'C', 'D', 'E'];
  const optLabels = optionStyle === 'thai' ? CHOICE_LABELS_THAI : CHOICE_LABELS_ENG;

  // Smart Single-Page Column Calculation
  const getColumnsCount = (total: number) => {
    if (total <= 20) return 2;
    if (total <= 40) return 2;
    if (total <= 60) return 3;
    if (total <= 80) return 4;
    return 4; // 100 questions -> 4 cols
  };

  const columnsCount = getColumnsCount(totalQuestions);
  const questionsPerCol = Math.ceil(totalQuestions / columnsCount);

  // Compact Auto-Fit Sizing
  const isCompact = questionsPerCol > 16;
  const isUltraCompact = questionsPerCol > 22;

  // Box size mapping based on user selection + question density
  const getBoxClass = () => {
    if (markType === 'cross') {
      if (boxSizeChoice === 'xlarge') {
        return isUltraCompact ? 'w-6 h-6' : isCompact ? 'w-7 h-7' : 'w-9 h-9';
      }
      if (boxSizeChoice === 'large') {
        return isUltraCompact ? 'w-5.5 h-5.5' : isCompact ? 'w-6 h-6' : 'w-7.5 h-7.5';
      }
      // Medium
      return isUltraCompact ? 'w-5 h-5' : isCompact ? 'w-5.5 h-5.5' : 'w-6.5 h-6.5';
    } else {
      // Bubble Circle
      if (boxSizeChoice === 'xlarge') {
        return isUltraCompact ? 'w-5.5 h-5.5' : isCompact ? 'w-6.5 h-6.5' : 'w-8 h-8';
      }
      if (boxSizeChoice === 'large') {
        return isUltraCompact ? 'w-5 h-5' : isCompact ? 'w-6 h-6' : 'w-7 h-7';
      }
      return isUltraCompact ? 'w-4.5 h-4.5' : isCompact ? 'w-5 h-5' : 'w-6 h-6';
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-16">
      {/* Global CSS for Single Page Print Guarantee */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          body, html, main {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
            height: 100% !important;
          }
          aside, header, nav, .print\:hidden {
            display: none !important;
          }
          #printable-answer-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: 285mm !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Header element - Hidden on print */}
      <div className="print:hidden">
        <Header
          title="📝 ระบบสร้างกระดาษคำตอบ & กระดาษกากบาท"
          subtitle="ออกแบบกระดาษฝนคำตอบหรือกากบาท ปรับขนาดช่องใหญ่พิเศษ สวยงาม คมชัด พอดี 1 หน้า A4"
        />
      </div>

      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Integrated Feature Announcement Banner */}
        <div className="print:hidden bg-gradient-to-r from-brand-600 via-brand-700 to-purpleBrand-700 text-white rounded-3xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" /> ✨ ใหม่! ระบบสร้างกระดาษคำตอบรวมอยู่ในระบบสลับข้อสอบแล้ว
            </h3>
            <p className="text-xs text-brand-100">
              เมื่อคุณออกแบบข้อสอบ สลับชุดข้อสอบ A-B-C หรือเลือกข้อสอบจากคลังในระบบสลับข้อสอบ ระบบจะสร้างกระดาษคำตอบ (ทั้งฉบับนักเรียนและฉบับเฉลยครู) ที่เชื่อมโยงตรงกับชุดข้อสอบให้อัตโนมัติทันที!
            </p>
          </div>
          <a
            href="/exam-shuffler"
            className="bg-white text-brand-700 hover:bg-brand-50 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 flex-shrink-0"
          >
            🚀 ไปยังระบบจัดทำข้อสอบ & กระดาษคำตอบอัตโนมัติ
          </a>
        </div>
        {/* Controls Configuration Box - Hidden on print */}
        <div className="print:hidden bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" /> ตั้งค่ากระดาษคำตอบและขนาดช่องกากบาท
            </h3>
            <button
              onClick={handlePrint}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              พิมพ์กระดาษคำตอบ / บันทึก PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Header Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                1. ข้อมูลหัวกระดาษและคำชี้แจง
              </h4>

              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  โลโก้โรงเรียน / ตราสัญลักษณ์
                </label>
                {logoImage ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={logoImage}
                      alt="School Logo"
                      className="w-12 h-12 object-contain border rounded-xl p-1 bg-slate-50"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> ลบโลโก้
                    </button>
                  </div>
                ) : (
                  <label className="border border-dashed border-slate-300 hover:border-brand-500 bg-slate-50/50 p-3 rounded-2xl cursor-pointer flex items-center gap-3 text-xs text-slate-600 transition">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                    <span>อัปโหลดภาพโลโก้ (PNG / JPG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อโรงเรียน / สถาบัน
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หัวเรื่องแบบทดสอบ / การสอบ
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อวิชา / รหัสวิชา
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ครูผู้สอน</label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เวลาในการทำ
                  </label>
                  <input
                    type="text"
                    value={timeAllowed}
                    onChange={(e) => setTimeAllowed(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำชี้แจง / คำสั่ง
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Section 2: Answer Format */}
            <div className="space-y-4 border-l border-slate-100 pl-0 md:pl-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                2. รูปแบบคำตอบและขนาดช่องกากบาท
              </h4>

              {/* Mark Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  รูปแบบการตอบคำตอบ
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMarkType('cross')}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition ${
                      markType === 'cross'
                        ? 'border-brand-600 bg-brand-50/70 text-brand-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-base">
                      ✕
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold">ช่องกากบาท ⬜</p>
                      <p className="text-[10px] text-slate-500 font-normal">
                        กากบาทลงในช่องสี่เหลี่ยม
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setMarkType('bubble')}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition ${
                      markType === 'bubble'
                        ? 'border-brand-600 bg-brand-50/70 text-brand-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-base">
                      ⚪
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold">ฝนวงกลม ⚪</p>
                      <p className="text-[10px] text-slate-500 font-normal">
                        ใช้ดินสอฝนในวงกลม
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Box Size Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-brand-600" /> ขนาดช่องกากบาท / วงกลม (Box Size)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setBoxSizeChoice('medium')}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      boxSizeChoice === 'medium'
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ปานกลาง
                  </button>
                  <button
                    onClick={() => setBoxSizeChoice('large')}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      boxSizeChoice === 'large'
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ใหญ่ (แนะนำ ⭐)
                  </button>
                  <button
                    onClick={() => setBoxSizeChoice('xlarge')}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      boxSizeChoice === 'xlarge'
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ใหญ่พิเศษ 🟩
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  จำนวนข้อสอบทั้งหมด (ข้อ)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[10, 15, 20, 30, 40, 50, 60, 100].map((num) => (
                    <button
                      key={num}
                      onClick={() => setTotalQuestions(num)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                        totalQuestions === num
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {num} ข้อ
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    จำนวนตัวเลือกคำตอบ
                  </label>
                  <select
                    value={optionCount}
                    onChange={(e) => setOptionCount(Number(e.target.value) as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value={4}>4 ตัวเลือก (ก-ง / A-D)</option>
                    <option value={5}>5 ตัวเลือก (ก-จ / A-E)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ภาษาตัวเลือก
                  </label>
                  <select
                    value={optionStyle}
                    onChange={(e: any) => setOptionStyle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value="thai">ภาษาไทย (ก, ข, ค, ง)</option>
                    <option value="english">ภาษาอังกฤษ (A, B, C, D)</option>
                  </select>
                </div>
              </div>

              {/* Section 3: Answer Key Mode & Typography */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" /> 3. โหมดเฉลยคำตอบและแบบฟอนต์
                </h4>

                {/* Answer Key Toggle */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnswerKeyMode}
                      onChange={(e) => setIsAnswerKeyMode(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                      🔑 พิมพ์เฉลยลงบนกระดาษทำตอบ (กากบาท/ฝนเต็มช่อง)
                    </span>
                  </label>

                  {isAnswerKeyMode && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                          เลือกชุดข้อสอบสำหรับทำเฉลย
                        </label>
                        <select
                          value={selectedVersionKey}
                          onChange={(e) => setSelectedVersionKey(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 text-xs font-bold bg-white text-emerald-900"
                        >
                          <option value="A">เฉลยชุด A</option>
                          <option value="B">เฉลยชุด B</option>
                          <option value="C">เฉลยชุด C</option>
                          <option value="D">เฉลยชุด D</option>
                          <option value="E">เฉลยชุด E</option>
                        </select>
                      </div>

                      {examBankList.length > 0 && (
                        <div>
                          <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                            ดึงเฉลยจากคลังข้อสอบ
                          </label>
                          <select
                            value={selectedBankId}
                            onChange={(e) => handleSelectBankItem(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 text-xs font-semibold bg-white text-emerald-900"
                          >
                            <option value="">-- เลือกชุดข้อสอบในคลัง --</option>
                            {examBankList.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.title} ({b.questionsCount} ข้อ)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Font & Size Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Type className="w-3.5 h-3.5 text-slate-500" /> รูปแบบฟอนต์ (Font Family)
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e: any) => setFontFamily(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                    >
                      <option value="Sarabun">Sarabun (สารบัญ - มาตรฐาน)</option>
                      <option value="Prompt">Prompt (พรอพมท์ - ทันสมัย)</option>
                      <option value="Kanit">Kanit (คณิต - ตัวเข้มชัด)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-slate-500" /> ขนาดตัวอักษร (Font Size)
                    </label>
                    <select
                      value={fontSize}
                      onChange={(e: any) => setFontSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                    >
                      <option value="small">เล็ก (Small)</option>
                      <option value="medium">ปานกลาง (Medium - Standard)</option>
                      <option value="large">ใหญ่ (Large)</option>
                      <option value="xlarge">ใหญ่พิเศษ (Extra Large)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Printable Paper Render */}
        <div className="space-y-3">
          <div className="print:hidden flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" /> ตัวอย่างกระดาษคำตอบ {isAnswerKeyMode && '(ฉบับเฉลย)'} (1 หน้า A4)
            </h3>
            <button
              onClick={handlePrint}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <Printer className="w-4 h-4" /> พิมพ์กระดาษคำตอบ
            </button>
          </div>

          {/* Actual Printable A4 Sheet */}
          <div
            id="printable-answer-sheet"
            style={{ fontFamily: fontFamily === 'Prompt' ? 'Prompt, sans-serif' : fontFamily === 'Kanit' ? 'Kanit, sans-serif' : 'Sarabun, sans-serif' }}
            className={`bg-white rounded-2xl border border-slate-300 shadow-xl text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full ${
              fontSize === 'small' ? 'text-[11px]' : fontSize === 'large' ? 'text-[15px]' : fontSize === 'xlarge' ? 'text-[17px]' : 'text-xs'
            } ${
              isUltraCompact ? 'p-4 md:p-6 space-y-2' : isCompact ? 'p-6 md:p-7 space-y-3' : 'p-8 md:p-10 space-y-5'
            }`}
          >
            {/* Paper Header Box */}
            <div className={`border-2 border-slate-900 rounded-lg relative ${
              isUltraCompact ? 'p-2.5 space-y-1' : isCompact ? 'p-3.5 space-y-2' : 'p-4 space-y-3'
            }`}>
              <div className="flex items-center gap-3 border-b border-slate-300 pb-2">
                {logoImage && (
                  <img
                    src={logoImage}
                    alt="Logo"
                    className={`${isUltraCompact ? 'w-10 h-10' : isCompact ? 'w-12 h-12' : 'w-14 h-14'} object-contain flex-shrink-0`}
                  />
                )}
                <div className="flex-1 text-center">
                  <h1 className={`${isUltraCompact ? 'text-sm' : isCompact ? 'text-base' : 'text-xl'} font-bold tracking-tight text-slate-900`}>
                    {schoolName}
                  </h1>
                  <h2 className={`${isUltraCompact ? 'text-xs' : 'text-sm'} font-semibold text-slate-800`}>
                    {examTitle}
                  </h2>
                  <p className={`${isUltraCompact ? 'text-[10px]' : 'text-xs'} font-medium text-slate-700`}>
                    {subject}
                  </p>
                </div>

                {isAnswerKeyMode && (
                  <div className="text-right flex-shrink-0">
                    <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                      เฉลยชุด: {selectedVersionKey}
                    </span>
                  </div>
                )}
              </div>

              {/* Meta details bar */}
              <div className={`flex flex-wrap items-center justify-between font-semibold text-slate-800 ${
                isUltraCompact ? 'text-[10px] pt-0.5' : 'text-xs pt-1'
              }`}>
                <span>{teacherName}</span>
                <span>{timeAllowed}</span>
                <span>
                  จำนวน: {totalQuestions} ข้อ ({optionCount} ตัวเลือก)
                </span>
              </div>

              {/* Instructions */}
              {instructions.trim() && (
                <div className={`font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded space-y-0.5 ${
                  isUltraCompact ? 'text-[9px] p-1' : 'text-[11px] p-1.5'
                }`}>
                  <p className="font-bold text-slate-900">คำชี้แจง / คำสั่ง:</p>
                  {instructions
                    .split(/\n|(?=(?:\s+|^)(?:\d+|[ก-ฮa-zA-Z])[\.\)\:]\s+)/g)
                    .map((l) => l.trim())
                    .filter(Boolean)
                    .map((line, idx) => (
                      <p key={idx} className="pl-1">
                        {line.match(/^(\d+|[ก-ฮa-zA-Z])[\.\)\:]/) ? line : `${idx + 1}. ${line}`}
                      </p>
                    ))}
                </div>
              )}

              {/* Student Fields */}
              <div className={`pt-1 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-semibold text-slate-900 ${
                isUltraCompact ? 'text-[10px]' : 'text-xs'
              }`}>
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="whitespace-nowrap">ชื่อ-นามสกุล:</span>
                  <div className="flex-1 border-b-2 border-dotted border-slate-600 h-3.5"></div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="w-36 flex items-center gap-1">
                    <span className="whitespace-nowrap">เลขประจำตัว:</span>
                    <div className="flex-1 border-b-2 border-dotted border-slate-600 h-3.5"></div>
                  </div>
                  <div className="w-24 flex items-center gap-1">
                    <span className="whitespace-nowrap">ชั้น/ห้อง:</span>
                    <div className="flex-1 border-b-2 border-dotted border-slate-600 h-3.5"></div>
                  </div>
                  <div className="w-20 flex items-center gap-1">
                    <span className="whitespace-nowrap">เลขที่:</span>
                    <div className="flex-1 border-b-2 border-dotted border-slate-600 h-3.5"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Answer Grid Table */}
            <div>
              <div className={`grid grid-cols-${columnsCount} gap-3`}>
                {Array.from({ length: columnsCount }).map((_, colIdx) => {
                  const startNum = colIdx * questionsPerCol + 1;
                  const endNum = Math.min((colIdx + 1) * questionsPerCol, totalQuestions);

                  if (startNum > totalQuestions) return null;

                  return (
                    <div key={colIdx} className={`border border-slate-400 rounded-lg ${
                      isUltraCompact ? 'p-1.5 space-y-1' : isCompact ? 'p-2 space-y-1' : 'p-2.5 space-y-1.5'
                    }`}>
                      {/* Grid Header */}
                      <div className={`flex items-center font-bold text-slate-800 border-b border-slate-300 ${
                        isUltraCompact ? 'text-xs pb-1' : 'text-sm pb-1'
                      }`}>
                        <span className="w-8 text-center">ข้อ</span>
                        <div className="flex-1 flex justify-around pl-1">
                          {Array.from({ length: optionCount }).map((_, oIdx) => (
                            <span key={oIdx} className="w-8 text-center font-bold">
                              {optLabels[oIdx]}.
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Question Rows */}
                      <div className="space-y-1">
                        {Array.from({ length: endNum - startNum + 1 }).map((_, rIdx) => {
                          const qNum = startNum + rIdx;

                          return (
                            <div
                              key={qNum}
                              className={`flex items-center font-semibold text-slate-800 border-b border-slate-100 last:border-none ${
                                isUltraCompact ? 'py-0.5 text-xs' : isCompact ? 'py-1 text-xs' : 'py-1.5 text-sm'
                              }`}
                            >
                              <span className="w-8 text-center font-bold text-slate-800">
                                {qNum}.
                              </span>
                              <div className="flex-1 flex justify-around pl-1">
                                {Array.from({ length: optionCount }).map((_, oIdx) => {
                                  const isKey = isAnswerKeyMode && (
                                    customKeyAnswers[qNum] !== undefined
                                      ? customKeyAnswers[qNum] === oIdx
                                      : ((qNum - 1) % optionCount) === oIdx
                                  );

                                  return (
                                    <div
                                      key={oIdx}
                                      className="w-8 flex justify-center items-center"
                                    >
                                      {markType === 'cross' ? (
                                        <div
                                          className={`border-2 border-slate-900 rounded flex items-center justify-center transition ${getBoxClass()} ${
                                            isKey ? 'bg-slate-900 text-white font-black shadow-xs' : ''
                                          }`}
                                        >
                                          {isKey && '✕'}
                                        </div>
                                      ) : (
                                        <div
                                          className={`border-2 border-slate-900 rounded-full flex items-center justify-center transition ${getBoxClass()} ${
                                            isKey ? 'bg-slate-900 text-white font-black shadow-xs' : ''
                                          }`}
                                        >
                                          {isKey && '●'}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Footer */}
            <div className={`flex justify-between items-end border-t border-slate-300 ${
              isUltraCompact ? 'pt-1' : 'pt-2'
            }`}>
              <div className={`${isUltraCompact ? 'text-[9px]' : 'text-[10px]'} text-slate-500 font-medium`}>
                กระดาษคำตอบ | {schoolName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
