'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { StorageManager } from '@/lib/storage';
import { ContentProfile, LessonSummary } from '@/types';
import { BookMarked, Sparkles, CheckCircle2, Download } from 'lucide-react';

function LessonSummaryContent() {
  const searchParams = useSearchParams();
  const profileIdParam = searchParams.get('profileId');

  const [profiles, setProfiles] = useState<ContentProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [docType, setDocType] = useState<string>('summary');
  const [generatedSummary, setGeneratedSummary] = useState<LessonSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    const list = StorageManager.getProfiles();
    setProfiles(list);
    if (profileIdParam && list.some((p) => p.id === profileIdParam)) {
      setSelectedProfileId(profileIdParam);
    } else if (list.length > 0) {
      setSelectedProfileId(list[0].id);
    }
  }, [profileIdParam]);

  const handleGenerate = async () => {
    const targetProfile = profiles.find((p) => p.id === selectedProfileId);
    if (!targetProfile) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: targetProfile,
          docType,
        }),
      });

      if (res.ok) {
        const sum = await res.json();
        StorageManager.saveSummary(sum);
        setGeneratedSummary(sum);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-indigo-600" /> ตั้งค่าการสร้างใบความรู้
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">รูปแบบเอกสาร</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-semibold bg-white"
            >
              <option value="summary">สรุปบทเรียนฉบับสมบูรณ์ (Summary)</option>
              <option value="knowledge_sheet">ใบความรู้ประจำหน่วย (Knowledge Sheet)</option>
              <option value="key_takeaways">Key Takeaways สรุปย่อ</option>
              <option value="vocabulary_sheet">แผ่นคำศัพท์สำคัญ (Vocabulary Sheet)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || profiles.length === 0}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-sm disabled:opacity-50 transition"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>[ 📚 สร้างสรุปบทเรียน / ใบความรู้ ]</span>
            </>
          )}
        </button>
      </div>

      {/* Summary Content Markdown Output */}
      {generatedSummary && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-800 text-center border-b pb-4">
            {generatedSummary.title}
          </h2>

          <div className="prose max-w-none text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
            {generatedSummary.contentMarkdown}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LessonSummaryPage() {
  return (
    <div className="flex-1 flex flex-col pb-16">
      <Header
        title="📚 Lesson Summary Generator (ระบบสร้างใบความรู้ & สรุปบทเรียน)"
        subtitle="สรุปสาระสำคัญ คำศัพท์น่ารู้ Key Takeaways และแบบทบทวนความเข้าใจท้ายบท"
      />
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">กำลังโหลด...</div>}>
        <LessonSummaryContent />
      </Suspense>
    </div>
  );
}
