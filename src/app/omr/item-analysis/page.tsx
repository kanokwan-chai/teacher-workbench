'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { OMRStore } from '@/lib/omr/omrStore';
import { Exam, ItemAnalysisData } from '@/lib/omr/types';
import { TrendingUp, BarChart3, HelpCircle, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export default function ItemAnalysisPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [analysisList, setAnalysisList] = useState<ItemAnalysisData[]>([]);

  useEffect(() => {
    const exms = OMRStore.getExams();
    setExams(exms);
    if (exms.length > 0) {
      setSelectedExamId(exms[0].id);
      setAnalysisList(OMRStore.getItemAnalysis(exms[0].id));
    }
  }, []);

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    setAnalysisList(OMRStore.getItemAnalysis(examId));
  };

  const CHOICE_LABELS: Record<string, string> = { A: 'ก', B: 'ข', C: 'ค', D: 'ง', E: 'จ' };

  const mostMissedQuestions = [...analysisList]
    .sort((a, b) => a.correct_percentage - b.correct_percentage)
    .slice(0, 5);

  return (
    <div className="flex-1 flex flex-col pb-16 font-sans">
      <Header
        title="📈 Item Analysis (ระบบวิเคราะห์ข้อสอบรายข้อ)"
        subtitle="วิเคราะห์ระดับความยากของข้อสอบ อัตราการเลือกตัวลวง (Distractor Frequency) และข้อที่นักเรียนตอบผิดมากที่สุด"
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Exam Selector */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-600" /> เลือกชุดข้อสอบสำหรับวิเคราะห์
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">ระบบจะประมวลผลคำตอบจากกระดาษสอบทั้งหมดที่สแกนแล้ว</p>
          </div>

          <select
            value={selectedExamId}
            onChange={(e) => handleExamChange(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white min-w-xs"
          >
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.exam_code} - {e.title}
              </option>
            ))}
          </select>
        </div>

        {/* Most Missed Questions Highlights */}
        {mostMissedQuestions.length > 0 && (
          <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6 space-y-3">
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> 5 อันดับข้อที่นักเรียนตอบผิดมากที่สุด (ควรทบทวนในชั้นเรียน)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {mostMissedQuestions.map((q) => (
                <div key={q.question_number} className="bg-white p-3 rounded-2xl border border-rose-200 space-y-1 text-xs shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">ข้อ {q.question_number}</span>
                    <span className="text-rose-600 font-extrabold">{q.correct_percentage}% ตอบถูก</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{q.question_text}</p>
                  <p className="text-[10px] font-bold text-emerald-700">เฉลย: ({CHOICE_LABELS[q.correct_answer]})</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Item Analysis Breakdown Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">
            รายละเอียดการกระจายตัวเลือกรายข้อ (Item Analysis Breakdown)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">ข้อที่</th>
                  <th className="p-3">โจทย์คำถาม</th>
                  <th className="p-3 text-center">เฉลย</th>
                  <th className="p-3 text-center">เลือก ก</th>
                  <th className="p-3 text-center">เลือก ข</th>
                  <th className="p-3 text-center">เลือก ค</th>
                  <th className="p-3 text-center">เลือก ง</th>
                  <th className="p-3 text-center">ไม่ตอบ/หลายช่อง</th>
                  <th className="p-3 text-center">อัตราตอบถูก (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysisList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      ไม่พบข้อมูลวิเคราะห์ข้อสอบ
                    </td>
                  </tr>
                ) : (
                  analysisList.map((item) => (
                    <tr key={item.question_number} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-800">{item.question_number}</td>
                      <td className="p-3 font-medium text-slate-900 max-w-xs truncate">{item.question_text}</td>
                      <td className="p-3 text-center font-bold text-emerald-700 bg-emerald-50/50">
                        ({CHOICE_LABELS[item.correct_answer]})
                      </td>
                      <td className={`p-3 text-center ${item.correct_answer === 'A' ? 'font-bold text-emerald-600' : 'text-slate-600'}`}>
                        {item.choice_counts.A} คน
                      </td>
                      <td className={`p-3 text-center ${item.correct_answer === 'B' ? 'font-bold text-emerald-600' : 'text-slate-600'}`}>
                        {item.choice_counts.B} คน
                      </td>
                      <td className={`p-3 text-center ${item.correct_answer === 'C' ? 'font-bold text-emerald-600' : 'text-slate-600'}`}>
                        {item.choice_counts.C} คน
                      </td>
                      <td className={`p-3 text-center ${item.correct_answer === 'D' ? 'font-bold text-emerald-600' : 'text-slate-600'}`}>
                        {item.choice_counts.D} คน
                      </td>
                      <td className="p-3 text-center text-slate-400">
                        {item.choice_counts.UNANSWERED + item.choice_counts.MULTIPLE} คน
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                            item.correct_percentage >= 70
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.correct_percentage >= 40
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {item.correct_percentage}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
