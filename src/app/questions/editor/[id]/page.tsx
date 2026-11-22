'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { StorageManager } from '@/lib/storage';
import { QuestionSet, Question, QualityCheckResult, QualityIssue } from '@/types';
import { runQualityCheck, balanceAnswerDistribution } from '@/lib/quality-checker';
import {
  Save,
  Download,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wand2,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Plus,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function QuestionEditorPage() {
  const params = useParams();
  const router = useRouter();
  const setId = params?.id as string;

  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [qualityReport, setQualityReport] = useState<QualityCheckResult | null>(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [isImproving, setIsImproving] = useState<boolean>(false);
  const [autoFixing, setAutoFixing] = useState<boolean>(false);
  const [customCommand, setCustomCommand] = useState<string>('');
  const [saveToast, setSaveToast] = useState<boolean>(false);

  useEffect(() => {
    if (setId) {
      const found = StorageManager.getQuestionSetById(setId);
      if (found) {
        setQuestionSet(found);
        setQualityReport(runQualityCheck(found.questions));
      }
    }
  }, [setId]);

  if (!questionSet) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
        <p className="text-base font-semibold">กำลังโหลดชุดข้อสอบ...</p>
      </div>
    );
  }

  const handleSave = (updatedQs?: QuestionSet) => {
    const target = updatedQs || questionSet;
    const report = runQualityCheck(target.questions);
    const updated = {
      ...target,
      qualityScore: report.overallStatus,
    };
    StorageManager.saveQuestionSet(updated);
    setQuestionSet(updated);
    setQualityReport(report);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleBalanceAnswers = () => {
    const rebalanced = balanceAnswerDistribution(questionSet.questions);
    const updatedSet = { ...questionSet, questions: rebalanced };
    handleSave(updatedSet);
  };

  // Run Auto-Fix AI command on flagged questions
  const handleAutoFix = async () => {
    if (!qualityReport || qualityReport.issues.length === 0) return;
    setAutoFixing(true);

    try {
      const updatedQuestions = [...questionSet.questions];
      const flaggedOrders = new Set(
        qualityReport.issues.filter((i) => i.questionOrder > 0).map((i) => i.questionOrder)
      );

      for (let i = 0; i < updatedQuestions.length; i++) {
        const q = updatedQuestions[i];
        if (flaggedOrders.has(q.questionOrder)) {
          const issue = qualityReport.issues.find((iss) => iss.questionOrder === q.questionOrder);
          const res = await fetch('/api/improve-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: q,
              actionCommand: issue?.recommendation || 'ปรับปรุงตัวเลือกและความยากให้ดีขึ้น',
              subject: questionSet.subject,
              topic: questionSet.title,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.question) {
              updatedQuestions[i] = data.question;
            }
          }
        }
      }

      const newSet = { ...questionSet, questions: updatedQuestions };
      handleSave(newSet);
    } catch (e) {
      console.error(e);
    } finally {
      setAutoFixing(false);
    }
  };

  // Run AI Quick Command on active single question
  const handleRunAiCommandOnActive = async (command: string) => {
    if (activeQuestionIdx < 0 || activeQuestionIdx >= questionSet.questions.length) return;
    setIsImproving(true);

    try {
      const targetQuestion = questionSet.questions[activeQuestionIdx];
      const res = await fetch('/api/improve-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: targetQuestion,
          actionCommand: command,
          subject: questionSet.subject,
          topic: questionSet.title,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.question) {
          const updatedQsList = [...questionSet.questions];
          updatedQsList[activeQuestionIdx] = data.question;
          const updatedSet = { ...questionSet, questions: updatedQsList };
          handleSave(updatedSet);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsImproving(false);
    }
  };

  const deleteQuestion = (idx: number) => {
    const updated = questionSet.questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, questionOrder: i + 1 }));
    handleSave({ ...questionSet, questions: updated, totalQuestions: updated.length });
    if (activeQuestionIdx >= updated.length) {
      setActiveQuestionIdx(Math.max(0, updated.length - 1));
    }
  };

  const duplicateQuestion = (idx: number) => {
    const target = questionSet.questions[idx];
    const dup: Question = {
      ...target,
      id: `q-${Date.now()}`,
      questionOrder: target.questionOrder + 1,
      questionText: `${target.questionText} (สำเนา)`,
    };
    const list = [...questionSet.questions];
    list.splice(idx + 1, 0, dup);
    const reordered = list.map((q, i) => ({ ...q, questionOrder: i + 1 }));
    handleSave({ ...questionSet, questions: reordered, totalQuestions: reordered.length });
  };

  const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= questionSet.questions.length) return;
    const list = [...questionSet.questions];
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;
    const reordered = list.map((q, i) => ({ ...q, questionOrder: i + 1 }));
    handleSave({ ...questionSet, questions: reordered });
    setActiveQuestionIdx(targetIdx);
  };

  const currentQ = questionSet.questions[activeQuestionIdx];

  return (
    <div className="flex-1 flex flex-col pb-16">
      <Header
        title={`📝 Question Editor & Quality Checker`}
        subtitle={`${questionSet.title} (${questionSet.totalQuestions} ข้อ)`}
      />

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <button
            onClick={() => router.push('/questions')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> กลับสู่ตัวสร้างข้อสอบ
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSave()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition shadow-2xs"
            >
              <Save className="w-4 h-4" /> บันทึกข้อสอบ
            </button>

            <button
              onClick={handleBalanceAnswers}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> กระจายคำตอบ A/B/C/D
            </button>

            <button
              onClick={() => router.push(`/export?qsId=${questionSet.id}`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-600 to-purpleBrand-600 text-white text-xs font-semibold rounded-xl hover:opacity-95 transition shadow-2xs"
            >
              <Download className="w-4 h-4" /> Export PDF / DOCX
            </button>
          </div>
        </div>

        {saveToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>บันทึกการเปลี่ยนแปลงแล้ว!</span>
          </div>
        )}

        {/* Quality Check Banner (#15 Requirement) */}
        {qualityReport && (
          <div
            className={`p-6 rounded-3xl border shadow-xs transition ${
              qualityReport.overallStatus === 'PASS'
                ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                : qualityReport.overallStatus === 'WARNING'
                ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                : 'bg-rose-50/70 border-rose-200/80 text-rose-950'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {qualityReport.overallStatus === 'PASS' ? (
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                    ✓
                  </div>
                ) : qualityReport.overallStatus === 'WARNING' ? (
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
                    ⚠
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold">
                    ✕
                  </div>
                )}
                <div>
                  <h4 className="text-base font-bold flex items-center gap-2">
                    Question Quality Checker: Status [{qualityReport.overallStatus}]
                  </h4>
                  <p className="text-xs opacity-80 mt-0.5">
                    การกระจายคำตอบ A:{qualityReport.answerDistribution.A} | B:{qualityReport.answerDistribution.B} | C:{qualityReport.answerDistribution.C} | D:{qualityReport.answerDistribution.D}
                  </p>
                </div>
              </div>

              {qualityReport.issues.length > 0 && (
                <button
                  onClick={handleAutoFix}
                  disabled={autoFixing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow hover:bg-black disabled:opacity-50 transition"
                >
                  {autoFixing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>AI กำลังปรับปรุงข้อสอบที่ถูก Flag...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-yellow-400 animate-pulse" />
                      <span>[ ปรับปรุงอัตโนมัติ ]</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Quality Issues Checklist */}
            {qualityReport.issues.length > 0 && (
              <div className="mt-4 pt-4 border-t border-black/10 space-y-2">
                <p className="text-xs font-bold">รายการที่ต้องตรวจสอบ / คำแนะนำปรับปรุง:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {qualityReport.issues.map((iss, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/80 border border-black/5 flex items-start gap-2"
                    >
                      <span className="font-bold text-amber-700">{iss.severity === 'ERROR' ? '✕' : '⚠'}</span>
                      <div>
                        <p className="font-semibold text-slate-800">{iss.message}</p>
                        <p className="text-[11px] text-slate-500">{iss.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Editor Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question List Column */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700">รายการข้อสอบ ({questionSet.questions.length} ข้อ)</h3>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {questionSet.questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  onClick={() => setActiveQuestionIdx(idx)}
                  className={`p-3 rounded-2xl border text-xs cursor-pointer transition flex items-start justify-between gap-2 ${
                    idx === activeQuestionIdx
                      ? 'bg-purpleBrand-50 border-purpleBrand-300 font-semibold shadow-2xs text-purpleBrand-950'
                      : 'bg-slate-50/50 border-slate-200/60 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="font-bold text-purpleBrand-600 shrink-0">{q.questionOrder}.</span>
                    <p className="line-clamp-2 leading-relaxed">{q.questionText}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 shrink-0">
                    {q.difficulty}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Question Editor Column */}
          {currentQ && (
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              {/* Question Control Actions */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-sm font-bold text-slate-800">
                  แก้ไขข้อที่ {currentQ.questionOrder}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => moveQuestion(activeQuestionIdx, 'up')}
                    disabled={activeQuestionIdx === 0}
                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    title="เลื่อนขึ้น"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveQuestion(activeQuestionIdx, 'down')}
                    disabled={activeQuestionIdx === questionSet.questions.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    title="เลื่อนลง"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => duplicateQuestion(activeQuestionIdx)}
                    className="p-1.5 text-slate-400 hover:text-brand-600"
                    title="ทำสำเนาข้อสอบ"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteQuestion(activeQuestionIdx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                    title="ลบข้อนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* AI Commands Quick Bar (#16 Requirement) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purpleBrand-50 to-brand-50 border border-purpleBrand-100 space-y-2">
                <p className="text-xs font-bold text-purpleBrand-900 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-purpleBrand-600" />
                  คำสั่ง AI ปรับแก้ข้อนี้แบบทันที:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'ทำให้ยากขึ้น',
                    'ทำให้ง่ายลง',
                    'เปลี่ยนเป็นสถานการณ์',
                    'สร้างตัวลวงใหม่',
                    'เปลี่ยนระดับเป็นวิเคราะห์',
                    'ทำให้เหมาะกับ ปวช.1',
                  ].map((cmd) => (
                    <button
                      key={cmd}
                      disabled={isImproving}
                      onClick={() => handleRunAiCommandOnActive(cmd)}
                      className="px-2.5 py-1 rounded-xl bg-white border border-purpleBrand-200 text-purpleBrand-800 text-[11px] font-medium hover:bg-purpleBrand-100 disabled:opacity-50 transition"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Text Editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">โจทย์คำถาม</label>
                <textarea
                  rows={3}
                  value={currentQ.questionText}
                  onChange={(e) => {
                    const list = [...questionSet.questions];
                    list[activeQuestionIdx].questionText = e.target.value;
                    setQuestionSet({ ...questionSet, questions: list });
                  }}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purpleBrand-500 font-sans"
                />
              </div>

              {/* Code Snippet & Sub-items Editor (for Coding / Fill-in Output Questions) */}
              {(currentQ.type === 'coding_question' || currentQ.type === 'coding' || currentQ.codeSnippet || (currentQ.subItems && currentQ.subItems.length > 0)) && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      💻 โค้ดโปรแกรม (Code Snippet / Array)
                    </label>
                    <textarea
                      rows={5}
                      value={currentQ.codeSnippet || ''}
                      onChange={(e) => {
                        const list = [...questionSet.questions];
                        list[activeQuestionIdx].codeSnippet = e.target.value;
                        setQuestionSet({ ...questionSet, questions: list });
                      }}
                      placeholder={`temperature = [28, 31, 29, 33, 35, 30]\nprint(temperature[0])\nprint(temperature[3])`}
                      className="w-full p-3 rounded-xl border border-slate-300 bg-slate-900 text-emerald-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purpleBrand-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        🔢 ข้อย่อยเติมผลลัพธ์จากการทำงานของโปรแกรม (Sub-questions)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const list = [...questionSet.questions];
                          const prevSub = list[activeQuestionIdx].subItems || [];
                          list[activeQuestionIdx].subItems = [
                            ...prevSub,
                            { label: `data[${prevSub.length}]`, answer: '' },
                          ];
                          setQuestionSet({ ...questionSet, questions: list });
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-purpleBrand-50 text-purpleBrand-700 hover:bg-purpleBrand-100 rounded-lg border border-purpleBrand-200 transition"
                      >
                        + เพิ่มข้อย่อย
                      </button>
                    </div>

                    {(currentQ.subItems || []).map((sub, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 w-5">{sIdx + 1}.</span>
                        <input
                          type="text"
                          value={sub.label}
                          onChange={(e) => {
                            const list = [...questionSet.questions];
                            const subs = [...(list[activeQuestionIdx].subItems || [])];
                            subs[sIdx] = { ...subs[sIdx], label: e.target.value };
                            list[activeQuestionIdx].subItems = subs;
                            setQuestionSet({ ...questionSet, questions: list });
                          }}
                          placeholder="เช่น temperature[0]"
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono bg-white"
                        />
                        <span className="text-xs font-bold text-slate-500">=</span>
                        <input
                          type="text"
                          value={sub.answer}
                          onChange={(e) => {
                            const list = [...questionSet.questions];
                            const subs = [...(list[activeQuestionIdx].subItems || [])];
                            subs[sIdx] = { ...subs[sIdx], answer: e.target.value };
                            list[activeQuestionIdx].subItems = subs;
                            setQuestionSet({ ...questionSet, questions: list });
                          }}
                          placeholder="คำตอบ เช่น 28"
                          className="flex-1 px-3 py-1.5 border border-emerald-300 rounded-xl text-xs font-mono font-bold bg-emerald-50/40 text-emerald-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...questionSet.questions];
                            list[activeQuestionIdx].subItems = (list[activeQuestionIdx].subItems || []).filter(
                              (_, i) => i !== sIdx
                            );
                            setQuestionSet({ ...questionSet, questions: list });
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Options List (for MCQ) */}
              {currentQ.type === 'multiple_choice' && currentQ.options && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    ตัวเลือกคำตอบ (เลือกปุ่มวิทยุหน้าข้อที่เป็นคำตอบถูกต้อง)
                  </label>
                  <div className="space-y-2">
                    {currentQ.options.map((opt, oIdx) => (
                      <div
                        key={opt.id || oIdx}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition ${
                          opt.isCorrect
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct-${currentQ.id}`}
                          checked={opt.isCorrect}
                          onChange={() => {
                            const list = [...questionSet.questions];
                            list[activeQuestionIdx].options = list[activeQuestionIdx].options?.map(
                              (o, idx) => ({ ...o, isCorrect: idx === oIdx })
                            );
                            setQuestionSet({ ...questionSet, questions: list });
                          }}
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                        />
                        <span className="font-bold text-xs text-slate-600 w-5">{opt.optionKey})</span>
                        <input
                          type="text"
                          value={opt.optionText}
                          onChange={(e) => {
                            const list = [...questionSet.questions];
                            if (list[activeQuestionIdx].options) {
                              list[activeQuestionIdx].options![oIdx].optionText = e.target.value;
                              setQuestionSet({ ...questionSet, questions: list });
                            }
                          }}
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purpleBrand-500 bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation Editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">คำอธิบายเฉลย</label>
                <textarea
                  rows={2}
                  value={currentQ.explanation || ''}
                  onChange={(e) => {
                    const list = [...questionSet.questions];
                    list[activeQuestionIdx].explanation = e.target.value;
                    setQuestionSet({ ...questionSet, questions: list });
                  }}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purpleBrand-500 font-sans"
                />
              </div>

              {/* Difficulty & Cognitive Selectors */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block mb-1">ระดับความยาก</label>
                  <select
                    value={currentQ.difficulty}
                    onChange={(e) => {
                      const list = [...questionSet.questions];
                      list[activeQuestionIdx].difficulty = e.target.value as any;
                      setQuestionSet({ ...questionSet, questions: list });
                    }}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="easy">ง่าย (Easy)</option>
                    <option value="medium">ปานกลาง (Medium)</option>
                    <option value="hard">ยาก (Hard)</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">ระดับการคิด (Cognitive)</label>
                  <select
                    value={currentQ.cognitiveLevel}
                    onChange={(e) => {
                      const list = [...questionSet.questions];
                      list[activeQuestionIdx].cognitiveLevel = e.target.value as any;
                      setQuestionSet({ ...questionSet, questions: list });
                    }}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="remember">จำ (Remember)</option>
                    <option value="understand">เข้าใจ (Understand)</option>
                    <option value="apply">ประยุกต์ใช้ (Apply)</option>
                    <option value="analyze">วิเคราะห์ (Analyze)</option>
                    <option value="evaluate">ประเมินค่า (Evaluate)</option>
                    <option value="create">สร้างสรรค์ (Create)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
