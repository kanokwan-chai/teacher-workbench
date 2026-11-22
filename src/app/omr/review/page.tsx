'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { OMRStore } from '@/lib/omr/omrStore';
import { ScanRecord, StudentAnswerResult, Student, DetectedAnswerStatus, ExamVersion } from '@/lib/omr/types';
import {
  AlertTriangle,
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  User,
  FileText,
  HelpCircle,
  XCircle,
} from 'lucide-react';

const CHOICE_LABELS: Record<string, string> = { A: 'ก', B: 'ข', C: 'ค', D: 'ง', E: 'จ' };

export default function ManualReviewPage() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [editedAnswers, setEditedAnswers] = useState<Record<number, DetectedAnswerStatus>>({});
  const [activeVersionKeyMap, setActiveVersionKeyMap] = useState<Record<number, string>>({});

  const loadData = () => {
    const scns = OMRStore.getScans();
    const stds = OMRStore.getStudents();
    setScans(scns);
    setStudents(stds);

    if (scns.length > 0 && !selectedScan) {
      handleSelectScan(scns[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectScan = (scan: ScanRecord) => {
    setSelectedScan(scan);
    setSelectedStudentId(scan.student_id || '');

    const map: Record<number, DetectedAnswerStatus> = {};
    scan.answers.forEach((ans) => {
      map[ans.question_number] = ans.final_answer;
    });
    setEditedAnswers(map);

    // Fetch version key map
    const ver = OMRStore.getVersionById(scan.version_id);
    const keyMap: Record<number, string> = {};
    if (ver && ver.questions) {
      ver.questions.forEach((vq) => {
        keyMap[vq.question_number_in_version] = vq.correct_choice_in_version;
      });
    }
    setActiveVersionKeyMap(keyMap);
  };

  const handleAnswerChange = (qNum: number, choice: DetectedAnswerStatus) => {
    setEditedAnswers((prev) => ({
      ...prev,
      [qNum]: choice,
    }));
  };

  const handleSaveReview = () => {
    if (!selectedScan) return;

    let newCorrect = 0;
    let newWrong = 0;
    let newUnanswered = 0;
    let newReview = 0;
    let newTotalScore = 0;

    const ver = OMRStore.getVersionById(selectedScan.version_id);

    const updatedAnswers = selectedScan.answers.map((ans) => {
      const finalVal = editedAnswers[ans.question_number] || ans.final_answer;

      const versionQ = ver?.questions?.find(
        (vq) => vq.question_number_in_version === ans.question_number
      );
      const correctChoice = versionQ ? versionQ.correct_choice_in_version : 'A';
      const isCorrect = finalVal === correctChoice;

      if (finalVal === 'UNANSWERED') newUnanswered++;
      else if (finalVal === 'MULTIPLE_ANSWERS' || finalVal === 'LOW_CONFIDENCE') newReview++;
      else if (isCorrect) {
        newCorrect++;
        newTotalScore++;
      } else {
        newWrong++;
      }

      return {
        ...ans,
        final_answer: finalVal,
        is_correct: isCorrect,
      };
    });

    const totalQ = updatedAnswers.length || 40;
    const percentage = Number(((newTotalScore / totalQ) * 100).toFixed(1));

    const updatedScan: ScanRecord = {
      ...selectedScan,
      student_id: selectedStudentId || selectedScan.student_id,
      scan_status: newReview === 0 ? 'SUCCESS' : 'LOW_CONFIDENCE',
      total_score: newTotalScore,
      correct_count: newCorrect,
      wrong_count: newWrong,
      unanswered_count: newUnanswered,
      review_count: newReview,
      percentage,
      answers: updatedAnswers,
    };

    OMRStore.saveScan(updatedScan);
    alert('บันทึกการตรวจสอบคำตอบและปรับคำนวณคะแนนใหม่เรียบร้อยแล้ว!');
    loadData();
  };

  const student = selectedScan
    ? students.find((s) => s.id === (selectedStudentId || selectedScan.student_id))
    : null;

  return (
    <div className="flex-1 flex flex-col pb-16 font-sans">
      <Header
        title="🔍 Manual Review (หน้าตรวจสอบความถูกต้องคำตอบ & ยืนยันคะแนน)"
        subtitle="ตรวจสอบข้อที่มีความมั่นใจต่ำ (Low Confidence) ปรับแก้คำตอบ และยืนยันคำนวณคะแนนสอบจริง"
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scan Items Sidebar */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">
              รายการกระดาษสอบที่สแกนแล้ว ({scans.length})
            </h3>

            <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
              {scans.map((sc) => {
                const st = students.find((s) => s.id === sc.student_id);
                const needsReview = sc.scan_status !== 'SUCCESS' || sc.review_count > 0;

                return (
                  <div
                    key={sc.id}
                    onClick={() => handleSelectScan(sc)}
                    className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                      selectedScan?.id === sc.id
                        ? 'bg-purpleBrand-50/80 border-purpleBrand-400 shadow-xs'
                        : needsReview
                        ? 'bg-amber-50/50 border-amber-300 hover:bg-amber-50'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] font-bold text-purpleBrand-700 bg-purpleBrand-100 px-2 py-0.5 rounded-full">
                        PAPER:{sc.paper_id}
                      </span>
                      {needsReview ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> รอตรวจ ({sc.review_count})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ยืนยันแล้ว
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {st ? `${st.first_name} ${st.last_name}` : 'กระดาษสอบไม่ระบุชื่อ'}
                        </p>
                        <p className="text-[11px] text-slate-500">{st?.class_name || '-'}</p>
                      </div>

                      <div className="text-right font-extrabold text-sm text-slate-900">
                        {sc.total_score} คะแนน <span className="text-[11px] text-slate-400 font-normal">({sc.percentage}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Panel Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedScan ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-purpleBrand-600" /> ตรวจสอบกระดาษสอบ: {student ? `${student.first_name} ${student.last_name}` : 'ไม่ระบุชื่อ'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Paper ID: PAPER:{selectedScan.paper_id} | วิชา: {selectedScan.exam_id}
                    </p>
                  </div>

                  <button
                    onClick={handleSaveReview}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                  >
                    <Save className="w-4 h-4" /> ยืนยันและบันทึกคะแนน
                  </button>
                </div>

                {/* Assign Student Dropdown if unassigned */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    ผูกกระดาษคำตอบนี้กับนักเรียนในระบบ:
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value="">-- ไม่ระบุชื่อนักเรียน --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.student_code} - {s.first_name} {s.last_name} ({s.class_name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Answers Grid Review */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purpleBrand-600" /> ตารางตรวจทานคำตอบรายข้อ (คลิกปุ่มเพื่อแก้ไขคำตอบ)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {selectedScan.answers.map((ans) => {
                      const isFlagged =
                        ans.detected_answer === 'LOW_CONFIDENCE' ||
                        ans.detected_answer === 'MULTIPLE_ANSWERS';

                      const currentVal = editedAnswers[ans.question_number] || ans.final_answer;
                      const correctKey = activeVersionKeyMap[ans.question_number] || 'A';
                      const isCorrect = currentVal === correctKey;

                      return (
                        <div
                          key={ans.question_number}
                          className={`p-3.5 rounded-2xl border text-xs space-y-2 transition ${
                            isCorrect
                              ? 'bg-emerald-50/70 border-emerald-300'
                              : isFlagged
                              ? 'bg-amber-50/80 border-amber-300'
                              : 'bg-rose-50/60 border-rose-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">ข้อ {ans.question_number}.</span>
                              <span className="text-[10px] font-bold text-purpleBrand-700 bg-purpleBrand-100 px-2 py-0.5 rounded-md">
                                เฉลย: ({CHOICE_LABELS[correctKey] || correctKey})
                              </span>
                            </div>

                            {isCorrect ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> ถูก (+1)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> ผิด (0)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] font-semibold text-slate-600">คำตอบสรุป:</span>
                            <div className="flex gap-1 flex-1">
                              {(['A', 'B', 'C', 'D', 'UNANSWERED'] as const).map((choice) => (
                                <button
                                  key={choice}
                                  type="button"
                                  onClick={() => handleAnswerChange(ans.question_number, choice)}
                                  className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition ${
                                    currentVal === choice
                                      ? choice === correctKey
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-rose-600 text-white shadow-xs'
                                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                                  }`}
                                >
                                  {choice === 'UNANSWERED' ? 'ไม่ตอบ' : CHOICE_LABELS[choice] || choice}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
                เลือกรายการสแกนทางด้านซ้ายเพื่อตรวจสอบคำตอบ
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
