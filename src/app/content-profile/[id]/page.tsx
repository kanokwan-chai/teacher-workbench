'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { StorageManager } from '@/lib/storage';
import { ContentProfile } from '@/types';
import {
  Save,
  FileQuestion,
  FileText,
  Target,
  BookMarked,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

export default function ContentProfileEditorPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params?.id as string;

  const [profile, setProfile] = useState<ContentProfile | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (profileId) {
      const found = StorageManager.getProfileById(profileId);
      if (found) {
        setProfile(found);
      }
    }
  }, [profileId]);

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
        <p className="text-base font-semibold">กำลังโหลด Content Profile...</p>
      </div>
    );
  }

  const handleSave = () => {
    StorageManager.saveProfile(profile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const addMainTopic = () => {
    setProfile({ ...profile, mainTopics: [...profile.mainTopics, 'หัวข้อใหม่'] });
  };
  const removeMainTopic = (idx: number) => {
    setProfile({ ...profile, mainTopics: profile.mainTopics.filter((_, i) => i !== idx) });
  };

  const addSubTopic = () => {
    setProfile({ ...profile, subTopics: [...profile.subTopics, 'หัวข้อย่อยใหม่'] });
  };
  const removeSubTopic = (idx: number) => {
    setProfile({ ...profile, subTopics: profile.subTopics.filter((_, i) => i !== idx) });
  };

  const addConcept = () => {
    setProfile({ ...profile, keyConcepts: [...profile.keyConcepts, 'แนวคิดใหม่'] });
  };
  const removeConcept = (idx: number) => {
    setProfile({ ...profile, keyConcepts: profile.keyConcepts.filter((_, i) => i !== idx) });
  };

  const addVocab = () => {
    setProfile({
      ...profile,
      vocabulary: [...profile.vocabulary, { word: 'คำใหม่', meaning: 'คำอธิบายความหมาย' }],
    });
  };
  const removeVocab = (idx: number) => {
    setProfile({ ...profile, vocabulary: profile.vocabulary.filter((_, i) => i !== idx) });
  };

  const addObjective = () => {
    setProfile({
      ...profile,
      learningObjectives: [...profile.learningObjectives, 'ผู้เรียนสามารถ...'],
    });
  };
  const removeObjective = (idx: number) => {
    setProfile({
      ...profile,
      learningObjectives: profile.learningObjectives.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="flex-1 flex flex-col pb-16">
      <Header
        title={`🧠 Content Profile Editor: ${profile.topic}`}
        subtitle="ตรวจสอบและปรับแต่งวิเคราะห์เนื้อหาก่อนนำไปสร้างข้อสอบ ใบงาน หรือกิจกรรม"
      />

      <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Navigation & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <button
            onClick={() => router.push('/library')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> กลับสู่คลังเนื้อหา
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition shadow-2xs"
            >
              <Save className="w-4 h-4" /> บันทึก Content Profile
            </button>

            <button
              onClick={() => {
                handleSave();
                router.push(`/questions?profileId=${profile.id}`);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purpleBrand-600 text-white text-xs font-semibold rounded-xl hover:bg-purpleBrand-700 transition shadow-2xs"
            >
              <FileQuestion className="w-4 h-4" /> 📝 สร้างข้อสอบจากเนื้อหานี้
            </button>

            <button
              onClick={() => {
                handleSave();
                router.push(`/worksheets?profileId=${profile.id}`);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition shadow-2xs"
            >
              <FileText className="w-4 h-4" /> 📄 สร้างใบงาน
            </button>

            <button
              onClick={() => {
                handleSave();
                router.push(`/activities?profileId=${profile.id}`);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-xl hover:bg-amber-700 transition shadow-2xs"
            >
              <Target className="w-4 h-4" /> 🎯 สร้างกิจกรรม
            </button>

            <button
              onClick={() => {
                handleSave();
                router.push(`/summaries?profileId=${profile.id}`);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition shadow-2xs"
            >
              <BookMarked className="w-4 h-4" /> 📚 สร้างใบความรู้
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>บันทึก Content Profile เรียบร้อยแล้ว!</span>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" /> ข้อมูลทั่วไป
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">วิชา</label>
              <input
                type="text"
                value={profile.subject}
                onChange={(e) => setProfile({ ...profile, subject: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">เรื่อง/หัวข้อหลัก</label>
              <input
                type="text"
                value={profile.topic}
                onChange={(e) => setProfile({ ...profile, topic: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ระดับชั้น</label>
              <input
                type="text"
                value={profile.gradeLevel || ''}
                onChange={(e) => setProfile({ ...profile, gradeLevel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Main Topics & Subtopics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">📌 หัวข้อหลัก (Main Topics)</h4>
              <button onClick={addMainTopic} className="text-brand-600 hover:text-brand-700 text-xs font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> เพิ่มหัวข้อ
              </button>
            </div>
            <div className="space-y-2">
              {profile.mainTopics.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...profile.mainTopics];
                      updated[idx] = e.target.value;
                      setProfile({ ...profile, mainTopics: updated });
                    }}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button onClick={() => removeMainTopic(idx)} className="text-slate-400 hover:text-rose-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">🔹 หัวข้อย่อย (Sub Topics)</h4>
              <button onClick={addSubTopic} className="text-brand-600 hover:text-brand-700 text-xs font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> เพิ่มหัวข้อย่อย
              </button>
            </div>
            <div className="space-y-2">
              {profile.subTopics.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...profile.subTopics];
                      updated[idx] = e.target.value;
                      setProfile({ ...profile, subTopics: updated });
                    }}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button onClick={() => removeSubTopic(idx)} className="text-slate-400 hover:text-rose-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Concepts & Learning Objectives */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">💡 แนวคิดสำคัญ (Key Concepts)</h4>
              <button onClick={addConcept} className="text-brand-600 hover:text-brand-700 text-xs font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> เพิ่มแนวคิด
              </button>
            </div>
            <div className="space-y-2">
              {profile.keyConcepts.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...profile.keyConcepts];
                      updated[idx] = e.target.value;
                      setProfile({ ...profile, keyConcepts: updated });
                    }}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button onClick={() => removeConcept(idx)} className="text-slate-400 hover:text-rose-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">🎯 จุดประสงค์การเรียนรู้ (Objectives)</h4>
              <button onClick={addObjective} className="text-brand-600 hover:text-brand-700 text-xs font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> เพิ่มจุดประสงค์
              </button>
            </div>
            <div className="space-y-2">
              {profile.learningObjectives.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...profile.learningObjectives];
                      updated[idx] = e.target.value;
                      setProfile({ ...profile, learningObjectives: updated });
                    }}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button onClick={() => removeObjective(idx)} className="text-slate-400 hover:text-rose-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vocabulary List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">📚 คำศัพท์สำคัญ (Key Vocabulary)</h4>
            <button onClick={addVocab} className="text-brand-600 hover:text-brand-700 text-xs font-semibold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> เพิ่มคำศัพท์
            </button>
          </div>
          <div className="space-y-2">
            {profile.vocabulary.map((v, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="คำศัพท์"
                  value={v.word}
                  onChange={(e) => {
                    const updated = [...profile.vocabulary];
                    updated[idx].word = e.target.value;
                    setProfile({ ...profile, vocabulary: updated });
                  }}
                  className="w-1/3 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                />
                <input
                  type="text"
                  placeholder="ความหมาย / คำอธิบาย"
                  value={v.meaning}
                  onChange={(e) => {
                    const updated = [...profile.vocabulary];
                    updated[idx].meaning = e.target.value;
                    setProfile({ ...profile, vocabulary: updated });
                  }}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button onClick={() => removeVocab(idx)} className="text-slate-400 hover:text-rose-500 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
