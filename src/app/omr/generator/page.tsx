'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { OMRStore } from '@/lib/omr/omrStore';
import { generatePaperQRCode } from '@/lib/omr/qrHelper';
import { Student, Exam, ExamVersion, AnswerSheet } from '@/lib/omr/types';
import {
  Printer,
  FileText,
  QrCode,
  Users,
  Sparkles,
  Download,
  CheckCircle2,
  Square,
  Circle,
  X,
  Upload,
  Image as ImageIcon,
  Star,
} from 'lucide-react';

const TH_CHOICE_LABELS = ['ก', 'ข', 'ค', 'ง', 'จ'];
const EN_CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E'];

export default function OMRAnswerSheetGeneratorPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [versions, setVersions] = useState<ExamVersion[]>([]);

  // Generator Config State (as shown in user's UI template)
  const [schoolName, setSchoolName] = useState('โรงเรียนสาธิตการศึกษา');
  const [examTitle, setExamTitle] = useState('แบบทดสอบวัดผลสัมฤทธิ์ทางการเรียน');
  const [subjectName, setSubjectName] = useState('วิชา วิทยาศาสตร์และเทคโนโลยี (ว21101)');
  const [teacherName, setTeacherName] = useState('ครูผู้สอน: ครูสมชาย ใจดี');
  const [timeLimit, setTimeLimit] = useState('เวลาในการทำ: 60 นาที');
  const [instructionText, setInstructionText] = useState(
    'คำชี้แจง: ให้ทำเครื่องหมายกากบาท (X) หรือฝนทับตัวเลือกที่ถูกต้องเพียงข้อเดียวลงในช่องคำตอบ'
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Bubble & Format Options
  const [bubbleStyle, setBubbleStyle] = useState<'cross' | 'circle'>('cross');
  const [boxSize, setBoxSize] = useState<'medium' | 'large' | 'xlarge'>('large');
  const [totalQuestions, setTotalQuestions] = useState<number>(40);
  const [choicesCount, setChoicesCount] = useState<4 | 5>(4);
  const [choiceLang, setChoiceLang] = useState<'th' | 'en'>('th');

  // Selection & Generated Sheets State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('ALL');
  const [generatedSheets, setGeneratedSheets] = useState<
    { sheet: AnswerSheet; student: Student; exam: Exam; version: ExamVersion; qrDataUrl: string }[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stds = OMRStore.getStudents();
    const exms = OMRStore.getExams();
    setStudents(stds);
    setExams(exms);
    if (exms.length > 0) {
      setSelectedExam(exms[0]);
      setVersions(OMRStore.getVersionsByExamId(exms[0].id));
      if (exms[0].total_questions) setTotalQuestions(exms[0].total_questions);
    }
  }, []);

  useEffect(() => {
    if (selectedExam) {
      setVersions(OMRStore.getVersionsByExamId(selectedExam.id));
      if (selectedExam.total_questions) setTotalQuestions(selectedExam.total_questions);
    }
  }, [selectedExam]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateSheets = async () => {
    setIsGenerating(true);

    try {
      const activeExam = selectedExam || {
        id: 'default-exam',
        exam_code: 'EXAM-01',
        title: examTitle,
        subject: subjectName,
        description: '',
        total_questions: totalQuestions,
        choices_count: choicesCount,
        created_at: new Date().toISOString(),
        questions: [],
      };

      const targetStudents =
        selectedStudentId === 'ALL'
          ? students.length > 0
            ? students
            : [
                {
                  id: 'std-demo-1',
                  student_id: '1001',
                  student_code: '67001',
                  first_name: 'สมชาย',
                  last_name: 'รักเรียน',
                  class_name: 'ม.1/1',
                  created_at: new Date().toISOString(),
                },
              ]
          : students.filter((s) => s.id === selectedStudentId);

      const targetVersions =
        selectedVersionId === 'ALL'
          ? versions.length > 0
            ? versions
            : [
                {
                  id: 'version-a',
                  exam_id: activeExam.id,
                  version_code: 'A' as const,
                  created_at: new Date().toISOString(),
                  questions: [],
                },
              ]
          : versions.filter((v) => v.id === selectedVersionId);

      const results = [];

      for (let i = 0; i < targetStudents.length; i++) {
        const student = targetStudents[i];
        const version = targetVersions[i % targetVersions.length];

        const randomPaperId = `8F${Math.floor(100 + Math.random() * 900)}K${i + 1}X`;
        const qrPayload = `PAPER:${randomPaperId}`;
        const qrDataUrl = await generatePaperQRCode(randomPaperId);

        const newSheet: AnswerSheet = {
          id: `sheet-${student.id}-${Date.now()}`,
          paper_id: randomPaperId,
          student_id: student.id,
          exam_id: activeExam.id,
          version_id: version.id,
          qr_payload: qrPayload,
          created_at: new Date().toISOString(),
        };

        OMRStore.saveAnswerSheet(newSheet);

        results.push({
          sheet: newSheet,
          student,
          exam: {
            ...activeExam,
            title: examTitle,
            subject: subjectName,
            total_questions: totalQuestions,
            choices_count: choicesCount,
          },
          version,
          qrDataUrl,
        });
      }

      setGeneratedSheets(results);
    } catch (err) {
      console.error('Generator error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentChoiceLabels = choiceLang === 'th' ? TH_CHOICE_LABELS : EN_CHOICE_LABELS;

  return (
    <div className="flex-1 flex flex-col pb-16 font-sans">
      {/* Top Printable Header hidden on print */}
      <div className="print:hidden">
        <Header
          title="📝 ระบบสร้างกระดาษคำตอบ & กระดาษกากบาท (OMR Generator)"
          subtitle="ออกแบบกระดาษฝนคำตอบหรือกากบาท ปรับขนาดช่องใหญ่พิเศษ สวยงาม คมชัด พอดี 1 หน้า A4"
        />
      </div>

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Configuration Control Panel (Matching User Uploaded UI Form) */}
        <div className="print:hidden bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purpleBrand-600" /> ตั้งค่ากระดาษคำตอบและขนาดช่องกากบาท
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateSheets}
                disabled={isGenerating}
                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
              >
                <QrCode className="w-4 h-4" /> สร้างกระดาษคำตอบ OMR พร้อม QR
              </button>

              {generatedSheets.length > 0 && (
                <button
                  onClick={handlePrint}
                  className="bg-purpleBrand-600 hover:bg-purpleBrand-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                >
                  <Printer className="w-4 h-4" /> พิมพ์กระดาษคำตอบ / บันทึก PDF
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1: Header & Instructions Config */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                1. ข้อมูลหัวกระดาษและคำชี้แจง
              </h4>

              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  โลโก้โรงเรียน / ตราสัญลักษณ์
                </label>
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-purpleBrand-400 bg-slate-50 hover:bg-purpleBrand-50/30 rounded-2xl p-3 text-center transition cursor-pointer flex items-center justify-center gap-3"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="School Logo" className="w-10 h-10 object-contain" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="text-xs font-medium text-slate-600">
                    {logoUrl ? 'เปลี่ยนภาพโลโก้' : 'อัปโหลดภาพโลโก้ (PNG / JPG)'}
                  </span>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อโรงเรียน / สถาบัน</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purpleBrand-500 focus:outline-none"
                  placeholder="โรงเรียนสาธิตการศึกษา..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หัวเรื่องแบบทดสอบ / การสอบ</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purpleBrand-500 focus:outline-none"
                  placeholder="แบบทดสอบวัดผลสัมฤทธิ์ทางการเรียน..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อวิชา / รหัสวิชา</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purpleBrand-500 focus:outline-none"
                  placeholder="วิชา วิทยาศาสตร์และเทคโนโลยี (ว21101)..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ครูผู้สอน</label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purpleBrand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เวลาในการทำ</label>
                  <input
                    type="text"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purpleBrand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">คำชี้แจง / คำสั่ง</label>
                <textarea
                  rows={2}
                  value={instructionText}
                  onChange={(e) => setInstructionText(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-purpleBrand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Column 2: Bubble & Format Options */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                2. รูปแบบคำตอบและขนาดช่องกากบาท
              </h4>

              {/* Answer Style: Cross vs Circle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">รูปแบบการตอบ</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBubbleStyle('cross')}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition ${
                      bubbleStyle === 'cross'
                        ? 'bg-purpleBrand-50 border-purpleBrand-500 ring-2 ring-purpleBrand-400 text-purpleBrand-900'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="w-7 h-7 border-2 border-slate-800 rounded-lg flex items-center justify-center font-bold text-xs">
                      <X className="w-4 h-4 text-purpleBrand-700" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold">ช่องกากบาท ❎</p>
                      <p className="text-[10px] text-slate-500">กากบาทลงในช่องสี่เหลี่ยม</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBubbleStyle('circle')}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition ${
                      bubbleStyle === 'circle'
                        ? 'bg-purpleBrand-50 border-purpleBrand-500 ring-2 ring-purpleBrand-400 text-purpleBrand-900'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="w-7 h-7 border-2 border-slate-800 rounded-full flex items-center justify-center font-bold text-xs">
                      ●
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold">ฝนวงกลม ⚪</p>
                      <p className="text-[10px] text-slate-500">ใช้ดินสอฝนทับในวงกลม</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Box Size */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  ขนาดช่องกากบาท / วงกลม (Box Size)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'medium', label: 'ปานกลาง' },
                    { id: 'large', label: 'ใหญ่ (แนะนำ ⭐)' },
                    { id: 'xlarge', label: 'ใหญ่พิเศษ 🟩' },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setBoxSize(sz.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition text-center ${
                        boxSize === sz.id
                          ? 'bg-purpleBrand-600 text-white border-purpleBrand-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Questions Count Pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">จำนวนข้อสอบทั้งหมด (ข้อ)</label>
                <div className="flex flex-wrap gap-2">
                  {[10, 15, 20, 30, 40, 50, 60, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTotalQuestions(num)}
                      className={`py-2 px-3.5 rounded-xl border text-xs font-bold transition ${
                        totalQuestions === num
                          ? 'bg-purpleBrand-600 text-white border-purpleBrand-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {num} ข้อ
                    </button>
                  ))}
                </div>
              </div>

              {/* Choices Count & Choice Language */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวนตัวเลือกคำตอบ</label>
                  <select
                    value={choicesCount}
                    onChange={(e) => setChoicesCount(Number(e.target.value) as 4 | 5)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  >
                    <option value={4}>4 ตัวเลือก (ก-ง / A-D)</option>
                    <option value={5}>5 ตัวเลือก (ก-จ / A-E)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ภาษาตัวเลือก</label>
                  <select
                    value={choiceLang}
                    onChange={(e) => setChoiceLang(e.target.value as 'th' | 'en')}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  >
                    <option value="th">ภาษาไทย (ก, ข, ค, ง)</option>
                    <option value="en">ภาษาอังกฤษ (A, B, C, D)</option>
                  </select>
                </div>
              </div>

              {/* Student & Version Linking */}
              <div className="pt-2 grid grid-cols-2 gap-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">รายชื่อนักเรียน (พิมพ์เฉพาะบุคคล)</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value="ALL">สร้างให้นักเรียนทุกคนในระบบ ({students.length} คน)</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.student_code} - {s.first_name} {s.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชุดเฉลย (Version)</label>
                  <select
                    value={selectedVersionId}
                    onChange={(e) => setSelectedVersionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value="ALL">สุ่มสลับชุดอัตโนมัติ (A, B, C, D)</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        เฉพาะชุด {v.version_code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live A4 Answer Sheet Preview Header */}
        <div className="print:hidden flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purpleBrand-600" /> ตัวอย่างกระดาษคำตอบ (1 หน้า A4)
          </h3>
          <button
            onClick={handlePrint}
            className="text-xs font-bold text-purpleBrand-700 hover:text-purpleBrand-900 flex items-center gap-1"
          >
            <Printer className="w-4 h-4" /> พิมพ์กระดาษคำตอบ
          </button>
        </div>

        {/* Live A4 Printable Canvas Sheets */}
        <div className="space-y-8">
          {(generatedSheets.length > 0
            ? generatedSheets
            : [
                {
                  sheet: { paper_id: '8F72K91X' },
                  student: { first_name: 'สมชาย', last_name: 'รักเรียน', student_code: '67001', class_name: 'ม.1/1' },
                  exam: { title: examTitle, subject: subjectName, total_questions: totalQuestions, choices_count: choicesCount },
                  version: { version_code: 'A' },
                  qrDataUrl: '',
                },
              ]
          ).map((item, sheetIdx) => {
            const totalQ = totalQuestions;
            const columnsCount = totalQ > 60 ? 4 : totalQ > 25 ? 2 : 1;
            const questionsPerCol = Math.ceil(totalQ / columnsCount);

            const activeChoices = currentChoiceLabels.slice(0, choicesCount);

            return (
              <div
                key={sheetIdx}
                className="omr-printable-page bg-white rounded-3xl border border-slate-300 shadow-xl p-8 md:p-10 space-y-4 text-slate-900 font-sans relative max-w-[800px] mx-auto min-h-[1050px]"
              >
                {/* 4 Corner Fiducial Anchor Markers */}
                <div className="absolute top-4 left-4 w-7 h-7 bg-black rounded-xs shadow-xs" title="Anchor Top-Left" />
                <div className="absolute top-4 right-4 w-7 h-7 bg-black rounded-xs shadow-xs" title="Anchor Top-Right" />
                <div className="absolute bottom-4 left-4 w-7 h-7 bg-black rounded-xs shadow-xs" title="Anchor Bottom-Left" />
                <div className="absolute bottom-4 right-4 w-7 h-7 bg-black rounded-xs shadow-xs" title="Anchor Bottom-Right" />

                {/* Header Banner */}
                <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3 relative">
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-1" />
                  )}
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{schoolName}</h2>
                  <p className="text-sm font-bold text-slate-800">{examTitle}</p>
                  <p className="text-xs font-semibold text-slate-700">{subjectName}</p>
                </div>

                {/* Meta details bar */}
                <div className="flex justify-between items-center text-xs font-semibold text-slate-800 pt-1">
                  <span>{teacherName}</span>
                  <span>{timeLimit}</span>
                  <span className="font-bold text-slate-900">จำนวน: {totalQ} ข้อ ({choicesCount} ตัวเลือก)</span>
                </div>

                {/* Instruction Box */}
                <div className="text-[11px] font-medium text-slate-900 bg-slate-50 border border-slate-300 p-2.5 rounded-xl">
                  {instructionText}
                </div>

                {/* Student Info & QR Code Row */}
                <div className="border border-slate-300 rounded-2xl p-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 text-xs font-semibold text-slate-900">
                    <div className="flex justify-between gap-2 border-b border-slate-200 pb-1.5">
                      <span>ชื่อ-นามสกุล: {item.student.first_name} {item.student.last_name}</span>
                      <span>เลขประจำตัว: {item.student.student_code}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>ชั้น/ห้อง: {item.student.class_name}</span>
                      <span>เลขที่: ........</span>
                      <span className="font-bold text-purpleBrand-800 bg-purpleBrand-100 px-2 py-0.5 rounded-full text-[11px]">
                        ชุดข้อสอบ: Version {item.version.version_code}
                      </span>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="text-center space-y-1 flex-shrink-0 border-l border-slate-300 pl-4">
                    {item.qrDataUrl ? (
                      <img src={item.qrDataUrl} alt="QR Code" className="w-20 h-20 object-contain mx-auto" />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center font-mono text-[9px] text-slate-400">
                        [QR CODE]
                      </div>
                    )}
                    <p className="font-mono font-bold text-[9px] text-slate-800">PAPER:{item.sheet.paper_id}</p>
                  </div>
                </div>

                {/* Bubble Answer Grid Table */}
                <div className="pt-2">
                  <div className={`grid grid-cols-${columnsCount} gap-4`}>
                    {Array.from({ length: columnsCount }).map((_, colIdx) => {
                      const startNum = colIdx * questionsPerCol + 1;
                      const endNum = Math.min((colIdx + 1) * questionsPerCol, totalQ);

                      if (startNum > totalQ) return null;

                      return (
                        <div key={colIdx} className="border-2 border-slate-900 rounded-2xl p-2.5 space-y-1 bg-white">
                          {/* Column Header */}
                          <div className="flex items-center text-xs font-bold text-slate-900 border-b-2 border-slate-900 pb-1.5">
                            <span className="w-8 text-center">ข้อ</span>
                            <div className="flex-1 flex justify-around">
                              {activeChoices.map((cLabel, oIdx) => (
                                <span key={oIdx} className="w-7 text-center font-bold">
                                  {cLabel}.
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Question Rows */}
                          <div className="space-y-1 pt-1">
                            {Array.from({ length: endNum - startNum + 1 }).map((_, rIdx) => {
                              const qNum = startNum + rIdx;

                              return (
                                <div
                                  key={qNum}
                                  className="flex items-center text-xs font-semibold text-slate-900 py-1 border-b border-slate-100 last:border-none"
                                >
                                  <span className="w-8 text-center font-bold text-slate-800">
                                    {qNum}.
                                  </span>
                                  <div className="flex-1 flex justify-around">
                                    {activeChoices.map((_, oIdx) => (
                                      <div key={oIdx} className="w-7 flex justify-center items-center">
                                        <div
                                          className={`border-2 border-slate-900 flex items-center justify-center font-normal transition ${
                                            bubbleStyle === 'cross' ? 'rounded-md' : 'rounded-full'
                                          } ${
                                            boxSize === 'medium'
                                              ? 'w-4 h-4 text-[9px]'
                                              : boxSize === 'large'
                                              ? 'w-5 h-5 text-[10px]'
                                              : 'w-6 h-6 text-xs font-bold'
                                          }`}
                                        >
                                          {/* Empty Bubble/Cross box */}
                                        </div>
                                      </div>
                                    ))}
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

                {/* Footer */}
                <div className="pt-4 flex justify-between items-end border-t border-slate-300">
                  <div className="text-[10px] text-slate-500 font-medium">
                    กระดาษสอบ OMR รหัส: PAPER:{item.sheet.paper_id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
