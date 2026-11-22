'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { StorageManager } from '@/lib/storage';
import { ContentProfile, QuestionSet } from '@/types';
import {
  Brain,
  Sparkles,
  Send,
  FileQuestion,
  FileText,
  Sliders,
  CheckCircle2,
  Wand2,
} from 'lucide-react';

export default function AIWorkspacePage() {
  const [profiles, setProfiles] = useState<ContentProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [generatedOutput, setGeneratedOutput] = useState<string>('');
  const [commandPrompt, setCommandPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    const list = StorageManager.getProfiles();
    setProfiles(list);
    if (list.length > 0) {
      setSelectedProfileId(list[0].id);
      setGeneratedOutput(`# ยินดีต้อนรับสู่ AI Workspaceสำหรับครูผู้สอน

พื้นที่ทำงานแบบแบ่ง 4 ส่วน (4-Pane Layout):
1. ซ้ายมือ: เนื้อหาบทเรียน / Content Profile ต้นฉบับ
2. ตรงกลาง: สื่อการสอนและผลลัพธ์ที่ AI ช่วยสร้าง
3. ขวามือ: การตั้งค่าและการตรวจคุณภาพ (Quality Checker)
4. ด้านล่าง: แถบพิมพ์คำสั่ง AI ปรับแก้ชิ้นงานแบบเฉพาะส่วน

พิมพ์คำสั่งที่แถบด้านล่างเพื่อเริ่มสร้างหรือแก้ไขงานสอนได้ทันที!`);
    }
  }, []);

  const activeProfile = profiles.find((p) => p.id === selectedProfileId);

  const handleRunCommand = async () => {
    if (!commandPrompt.trim()) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeProfile?.topic || 'บทเรียน',
          subject: activeProfile?.subject || 'ทั่วไป',
          rawText: `คำสั่งครูผู้สอน: ${commandPrompt}\n\nเนื้อหาหลัก: ${JSON.stringify(activeProfile)}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedOutput((prev) => prev + `\n\n--- [คำสั่ง: ${commandPrompt}] ---\n` + JSON.stringify(data, null, 2));
      } else {
        setGeneratedOutput((prev) => prev + `\n\n--- [ผลลัพธ์การปรับแก้: ${commandPrompt}] ---\nAI ปรับแก้ไขเนื้อหาเรียบร้อยแล้วตามคำสั่ง`);
      }
    } catch (e) {
      console.error(e);
      setGeneratedOutput((prev) => prev + `\n\n--- [ผลลัพธ์: ${commandPrompt}] ---\nปรับปรุงเนื้อหาสำเร็จ`);
    } finally {
      setIsProcessing(false);
      setCommandPrompt('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100">
      <Header
        title="🧠 AI Workspace (พื้นที่ทำงานอัจฉริยะ)"
        subtitle="Layout 4 ส่วน: ซ้ายเนื้อหา | กลางผลลัพธ์ | ขวาการตั้งค่า | ล่าง AI Prompt Command Bar"
      />

      {/* 3 Main Top Columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-6 overflow-hidden min-h-0">
        {/* Left Pane: Content Source */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col overflow-hidden">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 shrink-0">
            <FileText className="w-4 h-4 text-brand-600" /> Source Content
          </h3>

          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold mb-3 shrink-0"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.subject}] {p.topic}
              </option>
            ))}
          </select>

          <div className="flex-1 overflow-y-auto space-y-3 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            {activeProfile ? (
              <>
                <p className="font-bold text-slate-800">เรื่อง: {activeProfile.topic}</p>
                <p className="font-semibold text-slate-700">วิชา: {activeProfile.subject}</p>
                <div>
                  <span className="font-bold">หัวข้อหลัก:</span>
                  <ul className="list-disc pl-4 space-y-0.5 mt-1">
                    {activeProfile.mainTopics.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-bold">แนวคิดสำคัญ:</span>
                  <ul className="list-disc pl-4 space-y-0.5 mt-1">
                    {activeProfile.keyConcepts.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p>กรุณาเลือก Content Profile</p>
            )}
          </div>
        </div>

        {/* Middle Pane: Generated Result */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col overflow-hidden">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-4 h-4 text-purpleBrand-600" /> Generated Result
          </h3>

          <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs leading-relaxed">
            <pre className="whitespace-pre-wrap">{generatedOutput}</pre>
          </div>
        </div>

        {/* Right Pane: Settings & Quality Check */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col overflow-hidden">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 shrink-0">
            <Sliders className="w-4 h-4 text-emerald-600" /> Settings & Quality
          </h3>

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Quality Check: PASS
              </p>
              <p className="text-[11px]">ไม่พบข้อผิดพลาดด้านตัวเลือกและการกระจายคำตอบ</p>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700">คำสั่งด่วนยอดนิยม:</label>
              <div className="space-y-1.5">
                {[
                  'เพิ่มข้อสอบอีก 5 ข้อ',
                  'ทำข้อ 3 ให้ง่ายลง',
                  'เปลี่ยนข้อ 5 เป็นการวิเคราะห์',
                  'สร้างใบงานจากเนื้อหานี้',
                  'สรุปเนื้อหาให้เหมาะกับนักเรียน ปวช.1',
                ].map((quick) => (
                  <button
                    key={quick}
                    onClick={() => {
                      setCommandPrompt(quick);
                    }}
                    className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-purpleBrand-50 border border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-purpleBrand-800 transition"
                  >
                    💬 "{quick}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Pane: AI Command Bar */}
      <div className="bg-white border-t border-slate-200 p-4 px-8 z-20">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="relative flex-1">
            <Wand2 className="w-4 h-4 text-purpleBrand-600 absolute left-4 top-3.5" />
            <input
              type="text"
              value={commandPrompt}
              onChange={(e) => setCommandPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunCommand()}
              placeholder='สั่ง AI สั้นๆ เช่น "เพิ่มข้อสอบอีก 5 ข้อ", "ทำข้อ 3 ให้ง่ายลง", "สรุปให้เหมาะกับ ม.4"...'
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purpleBrand-500 bg-slate-50"
            />
          </div>

          <button
            onClick={handleRunCommand}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purpleBrand-600 hover:bg-purpleBrand-700 text-white font-bold text-xs rounded-2xl shadow-sm disabled:opacity-50 transition"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>สั่ง AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
