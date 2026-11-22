'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { FormattedMathText } from '@/components/common/FormattedMathText';
import { MathToolbar } from '@/components/common/MathToolbar';
import { OMRStore } from '@/lib/omr/omrStore';
import { Exam, ExamVersion, QuestionItem } from '@/lib/omr/types';
import {
  FileText,
  Plus,
  Shuffle,
  Copy,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  Save,
  Loader2,
  HelpCircle,
  Download,
  Printer,
} from 'lucide-react';

const CHOICE_LABELS: Record<string, string> = { A: 'ก', B: 'ข', C: 'ค', D: 'ง', E: 'จ' };

export default function ExamManagementPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [versions, setVersions] = useState<ExamVersion[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'paste' | 'versions'>('editor');

  // Modal State for New / Edit Exam
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examCode, setExamCode] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [choicesCount, setChoicesCount] = useState<4 | 5>(4);

  // Raw Text Paste state
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Questions editor state
  const [editingQuestions, setEditingQuestions] = useState<QuestionItem[]>([]);

  const loadData = async () => {
    const exms = OMRStore.getExams();
    setExams(exms);
    if (exms.length > 0 && !selectedExam) {
      setSelectedExam(exms[0]);
      setEditingQuestions(exms[0].questions || []);
      setVersions(OMRStore.getVersionsByExamId(exms[0].id));
    }
    const fetched = await OMRStore.fetchExamsAsync();
    if (fetched && fetched.length > 0) {
      setExams(fetched);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      setEditingQuestions(selectedExam.questions || []);
      setVersions(OMRStore.getVersionsByExamId(selectedExam.id));
    }
  }, [selectedExam]);

  // Handle New Exam Creation
  const handleCreateExamModal = () => {
    setEditingExamId(null);
    setExamCode(`EXAM-${Math.floor(100 + Math.random() * 900)}`);
    setTitle('แบบทดสอบวัดผลสัมฤทธิ์ทางการเรียน');
    setSubject('วิชา ภาษาไทย (ท21101)');
    setDescription('แบบทดสอบ 10 ข้อ 4 ตัวเลือก');
    setTotalQuestions(10);
    setChoicesCount(4);
    setIsExamModalOpen(true);
  };

  const handleEditExamModal = (ex: Exam) => {
    setEditingExamId(ex.id);
    setExamCode(ex.exam_code);
    setTitle(ex.title);
    setSubject(ex.subject);
    setDescription(ex.description || '');
    setTotalQuestions(ex.total_questions);
    setChoicesCount((ex.choices_count as 4 | 5) || 4);
    setIsExamModalOpen(true);
  };

  const handleSaveExamModal = (e: React.FormEvent) => {
    e.preventDefault();

    let questionsList: QuestionItem[] = [];

    if (editingExamId && selectedExam) {
      // Retain existing questions or adjust length
      const existing = selectedExam.questions || [];
      if (existing.length >= totalQuestions) {
        questionsList = existing.slice(0, totalQuestions);
      } else {
        questionsList = [
          ...existing,
          ...Array.from({ length: totalQuestions - existing.length }).map((_, i) => ({
            id: `q-${existing.length + i + 1}`,
            question_number: existing.length + i + 1,
            question_text: `โจทย์คำถามข้อที่ ${existing.length + i + 1}`,
            choice_a: `ตัวเลือก ก ข้อ ${existing.length + i + 1}`,
            choice_b: `ตัวเลือก ข ข้อ ${existing.length + i + 1}`,
            choice_c: `ตัวเลือก ค ข้อ ${existing.length + i + 1}`,
            choice_d: `ตัวเลือก ง ข้อ ${existing.length + i + 1}`,
            correct_answer: (['A', 'B', 'C', 'D'][i % 4]) as any,
          })),
        ];
      }
    } else {
      questionsList = Array.from({ length: totalQuestions }).map((_, i) => ({
        id: `q-${i + 1}`,
        question_number: i + 1,
        question_text: `โจทย์คำถามข้อที่ ${i + 1}`,
        choice_a: `ตัวเลือก ก ข้อ ${i + 1}`,
        choice_b: `ตัวเลือก ข ข้อ ${i + 1}`,
        choice_c: `ตัวเลือก ค ข้อ ${i + 1}`,
        choice_d: `ตัวเลือก ง ข้อ ${i + 1}`,
        correct_answer: (['A', 'B', 'C', 'D'][i % 4]) as any,
      }));
    }

    const savedExam = OMRStore.saveExam({
      id: editingExamId || undefined,
      exam_code: examCode,
      title,
      subject,
      description,
      total_questions: totalQuestions,
      choices_count: choicesCount,
      questions: questionsList,
    });

    generateExamVersions(savedExam, questionsList);

    setIsExamModalOpen(false);
    setSelectedExam(savedExam);
    setEditingQuestions(questionsList);
    loadData();
  };

  // Fisher-Yates shuffle array
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
  };

  // Helper to generate Versions A, B, C, D with shuffled choices & correct answers
  const generateExamVersions = (examObj: Exam, currentQuestions: QuestionItem[]) => {
    ['A', 'B', 'C', 'D'].forEach((vCode) => {
      // Shuffle question order or keep order
      let qList = currentQuestions.map((q, origIdx) => ({ q, origIdx }));
      if (vCode !== 'A') {
        qList = shuffleArray(qList);
      }

      const vQuestions = qList.map(({ q, origIdx }, qVersionIdx) => {
        // Shuffle choice order for B, C, D
        let optList = [
          { choice: 'A' as const, text: q.choice_a, origChoice: 'A' },
          { choice: 'B' as const, text: q.choice_b, origChoice: 'B' },
          { choice: 'C' as const, text: q.choice_c, origChoice: 'C' },
          { choice: 'D' as const, text: q.choice_d, origChoice: 'D' },
        ];

        if (vCode !== 'A') {
          optList = shuffleArray(optList);
        }

        // Find new correct choice letter in this version
        const correctOpt = optList.find((opt) => opt.origChoice === q.correct_answer);
        const correctChoiceInVersion = correctOpt ? correctOpt.choice : 'A';

        return {
          id: `vq-${vCode}-${qVersionIdx + 1}`,
          version_id: `version-${examObj.id}-${vCode}`,
          question_number_in_version: qVersionIdx + 1,
          original_question_id: q.id,
          shuffled_choices_json: optList.map((opt, i) => ({
            choice: (['A', 'B', 'C', 'D'][i]) as any,
            text: opt.text,
            original_choice: opt.origChoice,
          })),
          correct_choice_in_version: correctChoiceInVersion,
        };
      });

      const v: ExamVersion = {
        id: `version-${examObj.id}-${vCode}`,
        exam_id: examObj.id,
        version_code: vCode as any,
        created_at: new Date().toISOString(),
        questions: vQuestions,
      };

      OMRStore.saveVersion(v);
    });

    setVersions(OMRStore.getVersionsByExamId(examObj.id));
  };

  // Update single question text / choices / correct answer
  const handleUpdateQuestionItem = (index: number, updated: QuestionItem) => {
    const newQs = [...editingQuestions];
    newQs[index] = updated;
    setEditingQuestions(newQs);
  };

  const handleAddQuestionItem = () => {
    const newNum = editingQuestions.length + 1;
    const newQ: QuestionItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      question_number: newNum,
      question_text: `โจทย์คำถามข้อที่ ${newNum}`,
      choice_a: `ตัวเลือก ก ข้อ ${newNum}`,
      choice_b: `ตัวเลือก ข ข้อ ${newNum}`,
      choice_c: `ตัวเลือก ค ข้อ ${newNum}`,
      choice_d: `ตัวเลือก ง ข้อ ${newNum}`,
      correct_answer: 'A',
    };
    const updated = [...editingQuestions, newQ];
    setEditingQuestions(updated);
    if (selectedExam) {
      const updatedExam = OMRStore.saveExam({
        ...selectedExam,
        questions: updated,
        total_questions: updated.length,
      });
      generateExamVersions(updatedExam, updated);
      setSelectedExam(updatedExam);
    }
  };

  const handleDeleteQuestionItem = (qIndex: number) => {
    const updated = editingQuestions.filter((_, idx) => idx !== qIndex).map((q, idx) => ({
      ...q,
      question_number: idx + 1,
    }));
    setEditingQuestions(updated);
    if (selectedExam) {
      const updatedExam = OMRStore.saveExam({
        ...selectedExam,
        questions: updated,
        total_questions: updated.length,
      });
      generateExamVersions(updatedExam, updated);
      setSelectedExam(updatedExam);
    }
  };

  // Export Exam to Text File
  const handleExportTextFile = () => {
    if (!selectedExam) return;
    let content = `หัวข้อข้อสอบ: ${selectedExam.title}\n`;
    content += `ชื่อวิชา/ชั้นเรียน: ${selectedExam.subject}\n`;
    content += `รหัสข้อสอบ: ${selectedExam.exam_code}\n`;
    content += `จำนวนข้อสอบ: ${editingQuestions.length} ข้อ\n\n`;

    editingQuestions.forEach((q, idx) => {
      content += `${idx + 1}. ${q.question_text}\n`;
      content += `ก. ${q.choice_a}\n`;
      content += `ข. ${q.choice_b}\n`;
      content += `ค. ${q.choice_c}\n`;
      content += `ง. ${q.choice_d}\n`;
      content += `เฉลย: ${CHOICE_LABELS[q.correct_answer] || q.correct_answer}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedExam.exam_code}_${selectedExam.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save Questions changes and regenerate Version A-D answer keys
  const handleSaveQuestionsChanges = () => {
    if (!selectedExam) return;

    const updatedExam = OMRStore.saveExam({
      ...selectedExam,
      questions: editingQuestions,
      total_questions: editingQuestions.length,
    });

    generateExamVersions(updatedExam, editingQuestions);
    setSelectedExam(updatedExam);
    alert('บันทึกโจทย์และปรับปรุงเฉลยชุด A-B-C-D เรียบร้อยแล้ว!');
    loadData();
  };

  const lastFocusedInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        lastFocusedInputRef.current = target as HTMLInputElement | HTMLTextAreaElement;
      }
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  const handleInsertSymbol = (symbol: string) => {
    const target =
      lastFocusedInputRef.current ||
      (document.activeElement as HTMLInputElement | HTMLTextAreaElement | null);

    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? target.value.length;
      const val = target.value;
      const newVal = val.substring(0, start) + symbol + val.substring(end);

      const nativeSetter =
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;

      if (nativeSetter) {
        nativeSetter.call(target, newVal);
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.focus();
        setTimeout(() => {
          target.setSelectionRange(start + symbol.length, start + symbol.length);
        }, 0);
      }
    }
    try {
      navigator.clipboard.writeText(symbol);
    } catch {
      // Ignore clipboard error
    }
  };

  // Parse Raw Text using AI API
  const handleParseRawText = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    try {
      const res = await fetch('/api/shuffle-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        const parsedQuestions: QuestionItem[] = data.questions.map((q: any, i: number) => ({
          id: `q-${i + 1}`,
          question_number: i + 1,
          question_text: q.text || `โจทย์ข้อ ${i + 1}`,
          choice_a: q.options[0] || 'ตัวเลือก ก',
          choice_b: q.options[1] || 'ตัวเลือก ข',
          choice_c: q.options[2] || 'ตัวเลือก ค',
          choice_d: q.options[3] || 'ตัวเลือก ง',
          correct_answer: (['A', 'B', 'C', 'D'][q.answerIndex || 0]) as any,
        }));

        setEditingQuestions(parsedQuestions);
        setActiveTab('editor');
        alert(`แปลงข้อความสกัดโจทย์ได้สำเร็จ ${parsedQuestions.length} ข้อ`);
      } else {
        alert('ไม่สามารถแปลงข้อความได้ กรุณาตรวจสอบรูปแบบ');
      }
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการแปลงข้อความข้อสอบ');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDuplicateExam = (exam: Exam) => {
    const dupCode = `${exam.exam_code}-COPY`;
    const dup = OMRStore.saveExam({
      ...exam,
      id: undefined,
      exam_code: dupCode,
      title: `${exam.title} (สำเนา)`,
    });
    alert(`คัดลอกข้อสอบเป็น "${dup.title}" สำเร็จ`);
    loadData();
  };

  const handleDeleteExam = (id: string, titleStr: string) => {
    if (confirm(`คุณต้องการลบข้อสอบ "${titleStr}" หรือไม่?`)) {
      OMRStore.deleteExam(id);
      setSelectedExam(null);
      loadData();
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-16 font-sans">
      <Header
        title="📝 Exam & Version Management (จัดการข้อสอบ & เฉลยแยกชุด A-B-C-D)"
        subtitle="ใส่โจทย์ข้อสอบ เลือกข้อถูก (เฉลย), สลับตัวเลือก และคำนวณเฉลยชุด A-B-C-D ให้อัตโนมัติ"
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header Actions */}
        <div className="flex justify-between items-center bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purpleBrand-600" /> รายการข้อสอบในระบบ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">เลือกข้อสอบเพื่อจัดการโจทย์ กำหนดข้อถูก หรือวางข้อความ AI สกัด</p>
          </div>

          <button
            onClick={handleCreateExamModal}
            className="bg-purpleBrand-600 hover:bg-purpleBrand-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> สร้างข้อสอบใหม่
          </button>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exam List Sidebar */}
          <div className="space-y-3">
            {exams.map((ex) => (
              <div
                key={ex.id}
                onClick={() => setSelectedExam(ex)}
                className={`p-5 rounded-3xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                  selectedExam?.id === ex.id
                    ? 'bg-purpleBrand-50/70 border-purpleBrand-400 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] font-bold text-purpleBrand-700 bg-purpleBrand-100 px-2.5 py-0.5 rounded-full">
                      {ex.exam_code}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateExam(ex);
                        }}
                        className="p-1 text-slate-400 hover:text-brand-600 transition"
                        title="คัดลอกข้อสอบ"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteExam(ex.id, ex.title);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                        title="ลบข้อสอบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">{ex.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{ex.subject}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 pt-2 border-t border-slate-200/40">
                  <span>{ex.total_questions} ข้อ ({ex.choices_count} ตัวเลือก)</span>
                  <span className="text-purpleBrand-700 font-bold">4 ชุด (A-D)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Exam Details & Interactive Question Editor */}
          <div className="lg:col-span-2 space-y-6">
            {selectedExam ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{selectedExam.title}</h3>
                      <button
                        type="button"
                        onClick={() => handleEditExamModal(selectedExam)}
                        className="p-1 text-slate-400 hover:text-purpleBrand-600 transition"
                        title="แก้ไขหัวข้อและข้อมูลข้อสอบ"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      รหัส: {selectedExam.exam_code} | วิชา: {selectedExam.subject} | {editingQuestions.length} ข้อ
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportTextFile}
                      className="bg-purpleBrand-50 hover:bg-purpleBrand-100 text-purpleBrand-700 font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 border border-purpleBrand-200 transition"
                      title="ส่งออกไฟล์ข้อสอบ (.txt)"
                    >
                      <Download className="w-4 h-4" /> ส่งออกข้อสอบ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditExamModal(selectedExam)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-4 h-4 text-purpleBrand-600" /> แก้ไขชื่อ/วิชา/จำนวนข้อ
                    </button>
                    <button
                      onClick={handleSaveQuestionsChanges}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                    >
                      <Save className="w-4 h-4" /> บันทึกและคำนวณเฉลยชุด A-D ใหม่
                    </button>
                  </div>
                </div>

                {/* Sub Navigation Tabs */}
                <div className="flex bg-slate-100 rounded-2xl p-1 max-w-lg">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'editor'
                        ? 'bg-white text-purpleBrand-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ✏️ แก้ไขโจทย์ & เลือกข้อถูก ({editingQuestions.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('paste')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'paste'
                        ? 'bg-white text-purpleBrand-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ✨ วางข้อความ / AI แปลง
                  </button>
                  <button
                    onClick={() => setActiveTab('versions')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'versions'
                        ? 'bg-white text-purpleBrand-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📋 เฉลยชุด A-B-C-D
                  </button>
                </div>

                {/* TAB 1: Interactive Question Editor */}
                {activeTab === 'editor' && (
                  <div className="space-y-4">
                    <MathToolbar onInsertSymbol={handleInsertSymbol} />

                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500">
                        คลิกปุ่มตัวเลือกสีเขียว <strong>(ก, ข, ค, ง)</strong> เพื่อตั้งเฉลย | ปรับเพิ่ม/ลดจำนวนข้อได้ทันที
                      </p>

                      <button
                        type="button"
                        onClick={handleAddQuestionItem}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> เพิ่มข้อสอบใหม่
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                      {editingQuestions.map((q, qIndex) => (
                        <div
                          key={q.id}
                          className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="w-7 h-7 rounded-full bg-purpleBrand-100 text-purpleBrand-700 font-bold text-xs flex items-center justify-center">
                                {qIndex + 1}
                              </span>
                              <input
                                type="text"
                                value={q.question_text}
                                onChange={(e) =>
                                  handleUpdateQuestionItem(qIndex, { ...q, question_text: e.target.value })
                                }
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purpleBrand-500 focus:outline-none bg-white"
                                placeholder="พิมพ์คำถามข้อสอบ..."
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteQuestionItem(qIndex)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 transition"
                              title="ลบข้อนี้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-10">
                            {[
                              { key: 'A', text: q.choice_a, field: 'choice_a' },
                              { key: 'B', text: q.choice_b, field: 'choice_b' },
                              { key: 'C', text: q.choice_c, field: 'choice_c' },
                              { key: 'D', text: q.choice_d, field: 'choice_d' },
                            ].map((choiceObj) => (
                              <div
                                key={choiceObj.key}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                                  q.correct_answer === choiceObj.key
                                    ? 'bg-emerald-50 border-emerald-300'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateQuestionItem(qIndex, {
                                      ...q,
                                      correct_answer: choiceObj.key as any,
                                    })
                                  }
                                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition ${
                                    q.correct_answer === choiceObj.key
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                  title="คลิกเพื่อเลือกเป็นเฉลยที่ถูกต้อง"
                                >
                                  {CHOICE_LABELS[choiceObj.key]}
                                </button>
                                <input
                                  type="text"
                                  value={choiceObj.text}
                                  onChange={(e) =>
                                    handleUpdateQuestionItem(qIndex, {
                                      ...q,
                                      [choiceObj.field]: e.target.value,
                                    })
                                  }
                                  className="flex-1 bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 2: Raw Text Paste & AI Parse */}
                {activeTab === 'paste' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-purpleBrand-600" /> วางข้อความข้อสอบจาก Word / PDF
                      </h4>
                      <p className="text-xs text-slate-500">
                        คุณครูสามารถคัดลอกข้อสอบทั้งฉบับมาวางได้ ระบบ AI จะสกัดข้อถาม ตัวเลือก และเฉลยให้อัตโนมัติ
                      </p>
                    </div>

                    <MathToolbar onInsertSymbol={handleInsertSymbol} />

                    <textarea
                      rows={10}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder={`ตัวอย่างการวางข้อความ:\n1. ข้อใดคือดาวเคราะห์ที่อยู่ใกล้ดวงอาทิตย์มากที่สุด\nก. ดาวพุธ\nข. ดาวศุกร์\nค. โลก\nง. ดาวอังคาร\nเฉลย: ก\n\n2. ...`}
                      className="w-full p-4 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-purpleBrand-500 focus:outline-none"
                    />

                    <div className="flex justify-end">
                      <button
                        onClick={handleParseRawText}
                        disabled={isParsing || !rawText.trim()}
                        className="bg-purpleBrand-600 hover:bg-purpleBrand-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                      >
                        {isParsing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> กำลังสกัดโจทย์ข้อสอบ...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" /> สกัดเป็นโจทย์และนำเข้าระบบ
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: Master Answer Key Matrix */}
                {activeTab === 'versions' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ตารางเฉลยข้อสอบเฉพาะชุด A - B - C - D
                        </h4>
                        <p className="text-xs text-slate-500">
                          เมื่อทำการสลับชุด สลับข้อ หรือสลับตัวเลือก ระบบจะปรับเฉลยเฉพาะชุดให้อัตโนมัติ
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (selectedExam) {
                            generateExamVersions(selectedExam, editingQuestions);
                            alert('สุ่มสลับโจทย์และคำนวณเฉลยชุด A-D ใหม่เรียบร้อยแล้ว');
                          }
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition"
                      >
                        <Shuffle className="w-3.5 h-3.5" /> สลับชุด A-D ใหม่
                      </button>
                    </div>

                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">ข้อที่</th>
                            <th className="p-2.5">โจทย์คำถาม</th>
                            <th className="p-2.5 text-center bg-purpleBrand-100 text-purpleBrand-900">เฉลยชุด A</th>
                            <th className="p-2.5 text-center bg-indigo-100 text-indigo-900">เฉลยชุด B</th>
                            <th className="p-2.5 text-center bg-blue-100 text-blue-900">เฉลยชุด C</th>
                            <th className="p-2.5 text-center bg-teal-100 text-teal-900">เฉลยชุด D</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {editingQuestions.map((q, qIdx) => {
                            const vA = versions.find((v) => v.version_code === 'A')?.questions[qIdx];
                            const vB = versions.find((v) => v.version_code === 'B')?.questions[qIdx];
                            const vC = versions.find((v) => v.version_code === 'C')?.questions[qIdx];
                            const vD = versions.find((v) => v.version_code === 'D')?.questions[qIdx];

                            return (
                              <tr key={q.id} className="hover:bg-slate-50 transition">
                                <td className="p-2.5 font-bold text-slate-800">{q.question_number}</td>
                                <td className="p-2.5 text-slate-700">
                                  <FormattedMathText text={q.question_text} />
                                </td>
                                <td className="p-2.5 text-center font-bold text-purpleBrand-700 bg-purpleBrand-50/50">
                                  ({CHOICE_LABELS[vA?.correct_choice_in_version || 'A']})
                                </td>
                                <td className="p-2.5 text-center font-bold text-indigo-700 bg-indigo-50/50">
                                  ({CHOICE_LABELS[vB?.correct_choice_in_version || 'B']})
                                </td>
                                <td className="p-2.5 text-center font-bold text-blue-700 bg-blue-50/50">
                                  ({CHOICE_LABELS[vC?.correct_choice_in_version || 'C']})
                                </td>
                                <td className="p-2.5 text-center font-bold text-teal-700 bg-teal-50/50">
                                  ({CHOICE_LABELS[vD?.correct_choice_in_version || 'D']})
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
                เลือกข้อสอบจากรายการด้านซ้าย หรือกดสร้างข้อสอบใหม่
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Exam Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purpleBrand-600" /> สร้างข้อสอบใหม่
              </h3>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExamModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสข้อสอบ (exam_code) *
                </label>
                <input
                  type="text"
                  required
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-purpleBrand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">หัวข้อข้อสอบ *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-purpleBrand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">วิชา / กลุ่มสาระ *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-purpleBrand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนข้อสอบ</label>
                  <select
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value={10}>10 ข้อ</option>
                    <option value={15}>15 ข้อ</option>
                    <option value={20}>20 ข้อ</option>
                    <option value={30}>30 ข้อ</option>
                    <option value={40}>40 ข้อ</option>
                    <option value={50}>50 ข้อ</option>
                    <option value={60}>60 ข้อ</option>
                    <option value={100}>100 ข้อ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนตัวเลือก</label>
                  <select
                    value={choicesCount}
                    onChange={(e) => setChoicesCount(Number(e.target.value) as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value={4}>4 ตัวเลือก (ก-ง)</option>
                    <option value={5}>5 ตัวเลือก (ก-จ)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purpleBrand-600 hover:bg-purpleBrand-700 text-white shadow-xs transition"
                >
                  สร้างข้อสอบ & สลับชุด A-D
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
