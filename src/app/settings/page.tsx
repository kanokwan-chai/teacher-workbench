'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Key, Database, CheckCircle2, Loader2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { CuteGearIcon, CuteTeacherAvatar } from '@/components/icons/CuteIcons';

export default function SettingsPage() {
  const [teacherName, setTeacherName] = useState('คุณครูคนเก่ง');
  const [geminiKey, setGeminiKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showSupabaseUrl, setShowSupabaseUrl] = useState(false);
  const [showSupabaseAnonKey, setShowSupabaseAnonKey] = useState(false);

  // Fetch saved settings on load
  useEffect(() => {
    const savedName = localStorage.getItem('TEACHER_PROFILE_NAME');
    if (savedName) setTeacherName(savedName);

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/save-settings');
        if (res.ok) {
          const data = await res.json();
          if (data.geminiKey) setGeminiKey(data.geminiKey);
          else {
            const localG = localStorage.getItem('GEMINI_API_KEY');
            if (localG) setGeminiKey(localG);
          }

          if (data.supabaseUrl) setSupabaseUrl(data.supabaseUrl);
          else {
            const localUrl = localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL');
            if (localUrl) setSupabaseUrl(localUrl);
          }

          if (data.supabaseAnonKey) setSupabaseAnonKey(data.supabaseAnonKey);
          else {
            const localKey = localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY');
            if (localKey) setSupabaseAnonKey(localKey);
          }
        }
      } catch (e) {
        console.error(e);
        const localG = localStorage.getItem('GEMINI_API_KEY');
        if (localG) setGeminiKey(localG);
        const localUrl = localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL');
        if (localUrl) setSupabaseUrl(localUrl);
        const localKey = localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY');
        if (localKey) setSupabaseAnonKey(localKey);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiKey,
          supabaseUrl,
          supabaseAnonKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }

      // Save to localStorage as backup
      localStorage.setItem('TEACHER_PROFILE_NAME', teacherName.trim() || 'คุณครูคนเก่ง');
      localStorage.setItem('GEMINI_API_KEY', geminiKey);
      localStorage.setItem('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl);
      localStorage.setItem('NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-16">
      <Header
        title="⚙️ Settings (การตั้งค่าระบบ)"
        subtitle="ตั้งค่า API Keys และการเชื่อมต่อฐานข้อมูล Supabase สำหรับ Teacher Workbench"
      />

      <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>บันทึกการตั้งค่าลงใน .env.local ถาวรเรียบร้อยแล้ว! (ข้อมูลจะไม่หายเมื่อกด Refresh)</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSave} className="cute-card p-6 sm:p-8 space-y-6">
          {/* Teacher Profile Name */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-sky-100">
            <CuteTeacherAvatar className="w-16 h-16 shrink-0 drop-shadow-xs" />
            <div className="flex-1 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                ชื่อครูผู้สอน (แสดงบนแถบเมนูซ้ายล่าง)
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="เช่น ครูกนกวรรณ"
                className="w-full px-4 py-2.5 rounded-2xl border border-sky-100 bg-sky-50/40 focus:bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-300 transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-sky-100 pb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CuteGearIcon className="w-6 h-6" />
              <Key className="w-4 h-4 text-violet-600" /> ตั้งค่า Google Gemini API Key
            </h3>
            {isLoading && <Loader2 className="w-4 h-4 text-violet-600 animate-spin" />}
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-brand-50/60 rounded-2xl border border-brand-100 text-xs text-brand-900 leading-relaxed">
              🔒 <strong>ความปลอดภัยสูงสุด:</strong> API Key จะถูกบันทึกลงในไฟล์ <code>.env.local</code> ฝั่ง Server เสมอ
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">GEMINI_API_KEY</label>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AQ.Ab8... หรือ AIzaSy..."
                  className="w-full p-3.5 pr-12 rounded-2xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition"
                  title={showGeminiKey ? 'ซ่อน API Key' : 'แสดง API Key'}
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                ขอรับ API Key ฟรีจาก <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand-600 font-semibold underline flex items-center gap-0.5">Google AI Studio <ExternalLink className="w-3 h-3" /></a>
              </p>
            </div>
          </div>

          {/* Supabase Connection Settings */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-purpleBrand-600" /> การเชื่อมต่อ Supabase Database & Auth
            </h3>

            <div className="p-3.5 bg-purpleBrand-50/50 rounded-2xl border border-purpleBrand-100 text-xs text-purpleBrand-950 leading-relaxed">
              💡 <strong>ระบบ 2 ชั้น (Hybrid Storage):</strong> หากยังไม่ได้ใส่ Supabase ระบบจะใช้ <strong>Local Storage Fallback</strong> บันทึกข้อมูลให้ใช้งานในเครื่องได้ทันที
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">NEXT_PUBLIC_SUPABASE_URL</label>
                <div className="relative">
                  <input
                    type={showSupabaseUrl ? 'text' : 'password'}
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xxxx.supabase.co"
                    className="w-full p-3.5 pr-12 rounded-2xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purpleBrand-500 bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSupabaseUrl(!showSupabaseUrl)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition"
                    title={showSupabaseUrl ? 'ซ่อน URL' : 'แสดง URL'}
                  >
                    {showSupabaseUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</label>
                <div className="relative">
                  <input
                    type={showSupabaseAnonKey ? 'text' : 'password'}
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOi..."
                    className="w-full p-3.5 pr-12 rounded-2xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purpleBrand-500 bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSupabaseAnonKey(!showSupabaseAnonKey)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition"
                    title={showSupabaseAnonKey ? 'ซ่อน Key' : 'แสดง Key'}
                  >
                    {showSupabaseAnonKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-sky-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="cute-pill-btn inline-flex items-center gap-2 px-8 py-3 text-xs sm:text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>กำลังบันทึกลง .env.local...</span>
                </>
              ) : (
                <span>บันทึกการตั้งค่าถาวร ✨</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
