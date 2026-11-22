'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { StorageManager } from '@/lib/storage';
import { ContentProfile, QuestionType } from '@/types';
import {
  FileQuestion,
  Sparkles,
  Sliders,
  CheckSquare,
  AlertCircle,
  FileText,
} from 'lucide-react';

import { QuotaNoticeModal } from '@/components/common/QuotaNoticeModal';
import { useGeminiQuotaNotice } from '@/lib/useGeminiQuotaNotice';

function QuestionGeneratorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileIdParam = searchParams.get('profileId');

  const [profiles, setProfiles] = useState<ContentProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['multiple_choice']);
  const [difficultyRatio, setDifficultyRatio] = useState({ easy: 30, medium: 50, hard: 20 });
  const [cognitiveRatio, setCognitiveRatio] = useState({
    remember: 20,
    understand: 30,
    apply: 30,
    analyze: 20,
    evaluate: 0,
    create: 0,
  });
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { notice, closeNotice, handleFetchError } = useGeminiQuotaNotice();

  useEffect(() => {
    const list = StorageManager.getProfiles();
    setProfiles(list);
    if (profileIdParam && list.some((p) => p.id === profileIdParam)) {
      setSelectedProfileId(profileIdParam);
    } else if (list.length > 0) {
      setSelectedProfileId(list[0].id);
    }
  }, [profileIdParam]);

  const toggleType = (type: QuestionType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleGenerate = async () => {
    const currentProfile = profiles.find((p) => p.id === selectedProfileId);
    if (!currentProfile) {
      setErrorMsg('กรุณาเลือก Content Profile สำหรับสร้างข้อสอบ');
      return;
    }

    setErrorMsg('');
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: currentProfile,
          totalQuestions,
          questionTypes: selectedTypes,
          difficultyRatio,
          cognitiveRatio,
          customInstructions,
        }),
      });

      if (!res.ok) {
        const { handled, errorMessage } = await handleFetchError(res, 'เกิดข้อผิดพลาดในการสร้างข้อสอบ');
        if (!handled) {
          throw new Error(errorMessage);
        }
        return;
      }

      const { questionSet } = await res.json();
      StorageManager.saveQuestionSet(questionSet);
      router.push(`/questions/editor/${questionSet.id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Selection */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-600" />
          <span>เลือกเนื้อหาบทเรียน (Content Profile)</span>
        </h3>

        {profiles.length === 0 ? (
          <div className="py-6 text-center text-slate-500 space-y-2">
            <p className="text-xs">ยังไม่มี Content Profile ในคลังเนื้อหา</p>
            <button
              onClick={() => router.push('/upload')}
              className="px-4 py-2 bg-brand-50 text-brand-700 text-xs font-semibold rounded-xl"
            >
              + เพิ่มเนื้อหาใหม่ก่อน
            </button>
          </div>
        ) : (
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.subject}] {p.topic} ({p.gradeLevel || 'ทั่วไป'})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Question Configuration */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purpleBrand-600" />
          <span>การตั้งค่าชุดข้อสอบ</span>
        </h3>

        {/* Quantity & Question Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              จำนวนข้อทั้งหมด ({totalQuestions} ข้อ)
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
              <span>1 ข้อ</span>
              <span>10 ข้อ</span>
              <span>20 ข้อ</span>
              <span>30 ข้อ</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">ประเภทข้อสอบ</label>
            <div className="flex flex-wrap gap-2">
              {[
                { type: 'multiple_choice', label: 'ปรนัย 4 ตัวเลือก' },
                { type: 'true_false', label: 'ถูก / ผิด' },
                { type: 'fill_blank', label: 'เติมคำในช่องว่าง' },
                { type: 'short_answer', label: 'ตอบแบบสั้น' },
                { type: 'essay', label: 'อัตนัย / ความคิดเห็น' },
                { type: 'situation', label: 'สถานการณ์สมมติ' },
                { type: 'coding_question', label: 'โจทย์โค้ดดิ้ง' },
              ].map((t) => {
                const isChecked = selectedTypes.includes(t.type as QuestionType);
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => toggleType(t.type as QuestionType)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      isChecked
                        ? 'bg-purpleBrand-50 border-purpleBrand-300 text-purpleBrand-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isChecked ? '✓ ' : ''}{t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Difficulty Ratios */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700">
            สัดส่วนระดับความยาก (%)
          </label>
          <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1">
              <span className="text-emerald-700">ง่าย: {difficultyRatio.easy}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={difficultyRatio.easy}
                onChange={(e) =>
                  setDifficultyRatio({ ...difficultyRatio, easy: Number(e.target.value) })
                }
                className="w-full accent-emerald-600"
              />
            </div>
            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-1">
              <span className="text-amber-700">ปานกลาง: {difficultyRatio.medium}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={difficultyRatio.medium}
                onChange={(e) =>
                  setDifficultyRatio({ ...difficultyRatio, medium: Number(e.target.value) })
                }
                className="w-full accent-amber-600"
              />
            </div>
            <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-1">
              <span className="text-rose-700">ยาก: {difficultyRatio.hard}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={difficultyRatio.hard}
                onChange={(e) =>
                  setDifficultyRatio({ ...difficultyRatio, hard: Number(e.target.value) })
                }
                className="w-full accent-rose-600"
              />
            </div>
          </div>
        </div>

        {/* Cognitive Level Ratios */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700">
            สัดส่วนระดับการคิด (Cognitive Levels - Bloom's Taxonomy)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-medium">
            {[
              { key: 'remember', label: 'จำ (Remember)' },
              { key: 'understand', label: 'เข้าใจ (Understand)' },
              { key: 'apply', label: 'ประยุกต์ใช้ (Apply)' },
              { key: 'analyze', label: 'วิเคราะห์ (Analyze)' },
              { key: 'evaluate', label: 'ประเมินค่า (Evaluate)' },
              { key: 'create', label: 'สร้างสรรค์ (Create)' },
            ].map((c) => (
              <div key={c.key} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <div className="flex justify-between text-slate-700 font-semibold">
                  <span>{c.label}</span>
                  <span>{(cognitiveRatio as any)[c.key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={(cognitiveRatio as any)[c.key]}
                  onChange={(e) =>
                    setCognitiveRatio({ ...cognitiveRatio, [c.key]: Number(e.target.value) })
                  }
                  className="w-full accent-purpleBrand-600"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Custom Instruction */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            คำสั่งเพิ่มเติมแก่ AI (ถ้ามี)
          </label>
          <input
            type="text"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="เช่น เน้นโจทย์คำนวณ 3 ข้อ, เน้นสถานการณ์ในโรงงานอุตสาหกรรม"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purpleBrand-500"
          />
        </div>
      </div>

      {/* Generate Button */}
      <div className="pt-2">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || profiles.length === 0}
          className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purpleBrand-600 via-brand-600 to-purpleBrand-700 text-white font-bold text-sm rounded-2xl shadow-md hover:opacity-95 disabled:opacity-50 transition"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>AI กำลังออกแบบข้อสอบอย่างละเอียดยิบตามกฎคุณภาพ...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              <span>[ 📝 สร้างชุดข้อสอบด้วย AI ]</span>
            </>
          )}
        </button>
      </div>

      {/* Quota & Token Limit Modal */}
      <QuotaNoticeModal
        isOpen={notice.isOpen}
        onClose={closeNotice}
        errorType={notice.errorType}
        errorMessage={notice.errorMessage}
        retryAfterSeconds={notice.retryAfterSeconds}
        onRetry={handleGenerate}
      />
    </div>
  );
}

export default function ExamGeneratorPage() {
  return (
    <div className="flex-1 flex flex-col pb-16">
      <Header
        title="📝 AI Question Generator (ระบบสร้างข้อสอบ)"
        subtitle="ออกข้อสอบคุณภาพสูงตามสัดส่วนความยากและระดับการคิด (Cognitive Level)"
      />
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">กำลังโหลด...</div>}>
        <QuestionGeneratorContent />
      </Suspense>
    </div>
  );
}
