'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { OMRStore } from '@/lib/omr/omrStore';
import { processOMRImage, OMRProcessingResult } from '@/lib/omr/omrEngine';
import { ScanRecord, Exam, ExamVersion, Student } from '@/lib/omr/types';
import {
  Scan,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Camera,
  Loader2,
  Sparkles,
  ArrowRight,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

const CHOICE_LABELS: Record<string, string> = { A: 'ก', B: 'ข', C: 'ค', D: 'ง', E: 'จ' };

export default function OMRScannerPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [versions, setVersions] = useState<ExamVersion[]>([]);
  const [selectedVersionCode, setSelectedVersionCode] = useState<string>('A');

  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResults, setScanResults] = useState<
    { result: OMRProcessingResult; student: Student | null; fileName: string; selectedVerCode: string }[]
  >([]);
  const [expandedDetails, setExpandedDetails] = useState<Record<number, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadExams = async () => {
      let exms = OMRStore.getExams();
      setExams(exms);
      if (exms.length > 0) {
        setSelectedExamId(exms[0].id);
        const vers = OMRStore.getVersionsByExamId(exms[0].id);
        setVersions(vers);
        if (vers.length > 0) setSelectedVersionCode(vers[0].version_code);
      }
      const fetchedExams = await OMRStore.fetchExamsAsync();
      if (fetchedExams.length > 0) {
        setExams(fetchedExams);
      }
    };
    loadExams();
  }, []);

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    const vers = OMRStore.getVersionsByExamId(examId);
    setVersions(vers);
    if (vers.length > 0) setSelectedVersionCode(vers[0].version_code);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsProcessing(true);

    const files = Array.from(e.target.files);
    const resultsList: { result: OMRProcessingResult; student: Student | null; fileName: string; selectedVerCode: string }[] = [];

    const currentExams = OMRStore.getExams();
    const targetExam = currentExams.find((x) => x.id === selectedExamId) || currentExams[0];
    const examVersions = OMRStore.getVersionsByExamId(targetExam?.id || '');
    const activeVersion =
      examVersions.find((v) => v.version_code === selectedVersionCode) ||
      examVersions[0] || {
        id: 'fallback-ver',
        exam_id: targetExam?.id || 'ex-1',
        version_code: selectedVersionCode || 'A',
        created_at: new Date().toISOString(),
        questions: Array.from({ length: 40 }).map((_, i) => ({
          id: `fq-${i + 1}`,
          version_id: 'fallback-ver',
          question_number_in_version: i + 1,
          original_question_id: `q-${i + 1}`,
          original_question_number: i + 1,
          correct_choice_in_version: (['A', 'B', 'C', 'D'][i % 4]) as any,
        })),
      };

    for (const file of files) {
      try {
        const img = await loadImageFromFile(file);

        // Run OMR Engine with target active version key
        let evalVersion = activeVersion;
        let student: Student | null = null;

        // Run initial OMR Engine pass
        let omrResult = await processOMRImage(img, evalVersion);

        // If QR payload detected, match exact paper record and version key
        if (omrResult.detectedPaperId) {
          const sheet = OMRStore.getAnswerSheetByPaperId(omrResult.detectedPaperId);
          if (sheet) {
            student = OMRStore.getStudents().find((s) => s.id === sheet.student_id) || null;
            const matchedVersion = OMRStore.getVersionById(sheet.version_id);
            if (matchedVersion) {
              evalVersion = matchedVersion;
              omrResult = await processOMRImage(img, matchedVersion);
            }
          }
        }

        // Save scan to store
        const newScan: ScanRecord = {
          id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          paper_id: omrResult.detectedPaperId || `PAPER-SCAN-${Date.now()}`,
          exam_id: evalVersion.exam_id,
          version_id: evalVersion.id,
          student_id: student?.id || 'std-guest',
          overall_confidence: omrResult.scanRecord.overall_confidence || 1.0,
          scan_status: omrResult.overallStatus,
          total_score: omrResult.scanRecord.total_score || 0,
          correct_count: omrResult.scanRecord.correct_count || 0,
          wrong_count: omrResult.scanRecord.wrong_count || 0,
          unanswered_count: omrResult.scanRecord.unanswered_count || 0,
          review_count: omrResult.scanRecord.review_count || 0,
          percentage: omrResult.scanRecord.percentage || 0,
          scanned_at: new Date().toISOString(),
          answers: omrResult.scanRecord.answers || [],
        };

        OMRStore.saveScan(newScan);

        resultsList.push({
          result: omrResult,
          student,
          fileName: file.name,
          selectedVerCode: evalVersion.version_code,
        });
      } catch (err) {
        console.error('Scan error:', err);
      }
    }

    setScanResults((prev) => [...resultsList, ...prev]);
    setIsProcessing(false);
  };

  const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleExpand = (idx: number) => {
    setExpandedDetails((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="flex-1 flex flex-col pb-16 font-sans">
      <Header
        title="📷 OMR Exam Scanner (ตรวจข้อสอบกระดาษอัตโนมัติ)"
        subtitle="อัปโหลดภาพกระดาษสอบ อ่าน QR Code + 4 Anchor Markers ปรับภาพเอียง และตรวจคะแนนอัตโนมัติ"
      />

      <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Exam & Version Key Selection Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purpleBrand-600" /> ตั้งค่าข้อสอบ & ชุดเฉลยที่ต้องการตรวจ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">เลือกข้อสอบในระบบ *</label>
              <select
                value={selectedExamId}
                onChange={(e) => handleExamChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-purpleBrand-500 focus:outline-none"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.exam_code} - {ex.title} ({ex.total_questions} ข้อ)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">เลือกชุดเฉลยประจำกระดาษ (Version) *</label>
              <select
                value={selectedVersionCode}
                onChange={(e) => setSelectedVersionCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-purpleBrand-500 focus:outline-none"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.version_code}>
                    เฉลยเฉพาะชุด Version {v.version_code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Upload Box */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Scan className="w-5 h-5 text-emerald-600" /> อัปโหลดหรือสแกนภาพกระดาษคำตอบ OMR
          </h3>

          <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/50 rounded-3xl p-10 text-center transition cursor-pointer flex flex-col items-center space-y-3 block">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                คลิกหรือลากไฟล์ภาพกระดาษคำตอบหลายๆ ภาพมาวางที่นี่
              </p>
              <p className="text-xs text-slate-500 mt-1">
                รองรับไฟล์ PNG, JPG, JPEG (ภาพจะถูกจัดตรง ตรวจสอบวงกลมฝน และประเมินคะแนนเทียบเฉลยชุด {selectedVersionCode} ทันที)
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition"
            >
              เลือกไฟล์ภาพกระดาษสอบ
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <div>
              <p className="text-xs font-bold">กำลังอ่านคำตอบ ดัดภาพเอียง และตรวจประเมินผลเทียบกับเฉลยชุด {selectedVersionCode}...</p>
              <p className="text-[11px] text-emerald-700">ระบบ Computer Vision กำลังวิเคราะห์ Pixel Fill Ratio และประเมินคะแนนรายข้อ</p>
            </div>
          </div>
        )}

        {/* Results Stream */}
        {scanResults.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ผลการตรวจข้อสอบจริงและการประเมินผล ({scanResults.length} ฉบับ)
            </h3>

            <div className="space-y-4">
              {scanResults.map(({ result, student, fileName, selectedVerCode }, idx) => {
                const rec = result.scanRecord;
                const status = result.overallStatus;
                const isExpanded = !!expandedDetails[idx];
                const answers = rec.answers || [];

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                            status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {status === 'SUCCESS' ? '✓' : '!'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">
                              {student ? `${student.first_name} ${student.last_name}` : `กระดาษสอบ (${fileName})`}
                            </h4>
                            <span className="text-[10px] font-bold text-purpleBrand-700 bg-purpleBrand-100 px-2 py-0.5 rounded-full">
                              เฉลยชุด {selectedVerCode}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-slate-500 mt-0.5">
                            Paper QR: {result.detectedPaperId ? `PAPER:${result.detectedPaperId}` : 'สแกนอิสระ'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-500 font-medium">คะแนนประเมินจริง</p>
                          <p className="text-2xl font-extrabold text-emerald-700">
                            {rec.total_score} <span className="text-xs text-slate-400 font-normal">/ {answers.length} ข้อ ({rec.percentage}%)</span>
                          </p>
                        </div>

                        <button
                          onClick={() => toggleExpand(idx)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? 'ซ่อนตารางเฉลย' : 'ดูผลตรวจรายข้อ'}
                        </button>
                      </div>
                    </div>

                    {/* Status Alert Banner */}
                    <div
                      className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
                        status === 'SUCCESS'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50 border-amber-300 text-amber-900'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                        {result.statusMessage}
                      </span>
                      <span className="text-[11px] opacity-80">
                        ถูก: {rec.correct_count} | ผิด: {rec.wrong_count} | ไม่ตอบ: {rec.unanswered_count} | รอตรวจ: {rec.review_count}
                      </span>
                    </div>

                    {/* Visual Debug Overlay Image */}
                    <div className="pt-1">
                      <p className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purpleBrand-600" /> ภาพกระดาษสอบที่ดัดตรง & วงกลมตรวจคำตอบ (Visual Debug):
                      </p>
                      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900/5 flex justify-center p-2">
                        <img
                          src={result.warpedCanvas.toDataURL()}
                          alt="Scanned Warped Debug"
                          className="max-h-72 object-contain rounded-lg shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Detailed Question-by-Question Grading Matrix */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-purpleBrand-600" /> ตารางการเฉลยและประเมินผลคะแนนรายข้อ (ชุด {selectedVerCode})
                        </h5>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
                          {answers.map((ans) => {
                            const isCorrect = ans.is_correct;
                            const isUnanswered = ans.detected_answer === 'UNANSWERED';
                            const isMulti = ans.detected_answer === 'MULTIPLE_ANSWERS' || ans.detected_answer === 'LOW_CONFIDENCE';

                            return (
                              <div
                                key={ans.question_number}
                                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col justify-between space-y-1 ${
                                  isCorrect
                                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                                    : isUnanswered
                                    ? 'bg-slate-50 border-slate-200 text-slate-600'
                                    : 'bg-rose-50/70 border-rose-300 text-rose-950'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-[11px]">ข้อ {ans.question_number}</span>
                                  {isCorrect ? (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                      <CheckCircle2 className="w-3 h-3" /> +1
                                    </span>
                                  ) : isUnanswered ? (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-md">
                                      - 0
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                      <XCircle className="w-3 h-3" /> 0
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] pt-1 flex justify-between">
                                  <span>ตอบ: <strong>{ans.detected_answer !== 'UNANSWERED' ? CHOICE_LABELS[ans.detected_answer] || ans.detected_answer : 'ไม่ตอบ'}</strong></span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
