'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { StorageManager } from '@/lib/storage';
import { ContentProfile, Activity } from '@/types';
import { Target, Sparkles, CheckCircle2, Clock, Users } from 'lucide-react';

function ActivityGeneratorContent() {
  const searchParams = useSearchParams();
  const profileIdParam = searchParams.get('profileId');

  const [profiles, setProfiles] = useState<ContentProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [groupType, setGroupType] = useState<string>('group');
  const [duration, setDuration] = useState<string>('60 นาที');
  const [generatedActivity, setGeneratedActivity] = useState<Activity | null>(null);
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
      const res = await fetch('/api/generate-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: targetProfile,
          groupType,
          duration,
        }),
      });

      if (res.ok) {
        const act = await res.json();
        StorageManager.saveActivity(act);
        setGeneratedActivity(act);
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
          <Target className="w-4 h-4 text-amber-600" /> ตั้งค่าการสร้างกิจกรรม
        </h3>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block mb-1.5">รูปแบบการจัดกิจกรรม</label>
              <select
                value={groupType}
                onChange={(e) => setGroupType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="group">งานกลุ่ม (Group Work)</option>
                <option value="pair">จับคู่ (Pair Work)</option>
                <option value="individual">รายบุคคล (Individual Work)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1.5">ระยะเวลาจัดกิจกรรม</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="เช่น 50 นาที, 2 คาบเรียน"
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || profiles.length === 0}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl shadow-sm disabled:opacity-50 transition"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>[ 🎯 สร้างกิจกรรมการเรียนรู้ ]</span>
            </>
          )}
        </button>
      </div>

      {/* Activity Result Preview */}
      {generatedActivity && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4 text-center space-y-1">
            <h2 className="text-xl font-bold text-slate-800">{generatedActivity.title}</h2>
            <p className="text-xs text-slate-500 font-medium">
              รูปแบบ: {generatedActivity.groupType} | เวลา: {generatedActivity.duration}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800">📌 ขั้นตอนการจัดกิจกรรม:</h4>
            <div className="space-y-3">
              {generatedActivity.steps.map((step) => (
                <div key={step.stepNumber} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-xs space-y-1">
                  <p className="font-bold text-amber-900">
                    ขั้นที่ {step.stepNumber}: {step.title} ({step.durationMinutes} นาที)
                  </p>
                  <p className="text-slate-700">{step.description}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    <span className="font-semibold">ครู:</span> {step.teacherRole} | <span className="font-semibold">นักเรียน:</span> {step.studentRole}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <p className="font-bold text-slate-800">📣 คำสั่งผู้เรียน:</p>
            <p className="text-slate-700 leading-relaxed">{generatedActivity.studentInstructions}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActivityGeneratorPage() {
  return (
    <div className="flex-1 flex flex-col pb-16">
      <Header
        title="🎯 Activity Generator (ระบบสร้างกิจกรรมการเรียนรู้)"
        subtitle="สร้างกิจกรรม Active Learning พร้อมขั้นตอนการสอน คำสั่งผู้เรียน และเกณฑ์การประเมิน (Rubric)"
      />
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">กำลังโหลด...</div>}>
        <ActivityGeneratorContent />
      </Suspense>
    </div>
  );
}
