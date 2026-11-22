'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import { Header } from '@/components/layout/Header';
import { Calendar, Users, Sparkles, Download, CheckCircle2, RefreshCw, Printer } from 'lucide-react';

export default function DutyRosterPage() {
  const [studentText, setStudentText] = useState(
    '1. เด็กชายกิตติศักดิ์\n2. เด็กชายจิรพัฒน์\n3. เด็กชายณัฐวุฒิ\n4. เด็กหญิงกานดา\n5. เด็กหญิงชลธิชา\n6. เด็กหญิงณิชา\n7. เด็กชายธนกฤต\n8. เด็กชายพงศกร\n9. เด็กหญิงภัทราภรณ์\n10. เด็กหญิงศิริพร'
  );
  const [customTaskInput, setCustomTaskInput] = useState('');
  const [tasks, setTasks] = useState<string[]>(['เวรกวาดห้อง', 'เวรทิ้งขยะ', 'เวรเช็ดกระดาน', 'เวรจัดโต๊ะทำความสะอาด']);
  const [rosterResult, setRosterResult] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddTask = () => {
    if (customTaskInput.trim() && !tasks.includes(customTaskInput.trim())) {
      setTasks([...tasks, customTaskInput.trim()]);
      setCustomTaskInput('');
    }
  };

  const handleRemoveTask = (taskToRemove: string) => {
    setTasks(tasks.filter((t) => t !== taskToRemove));
  };

  const handleGenerateRoster = async () => {
    const rawNames = studentText
      .split('\n')
      .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(Boolean);

    if (rawNames.length === 0) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/duty-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentList: rawNames,
          tasks,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRosterResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintPdf = () => {
    if (!rosterResult) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(18);
    doc.text('Weekly Classroom Duty Roster - Daily Cleaning Schedule', 20, 20);
    doc.setFontSize(12);

    let y = 35;
    rosterResult.days.forEach((day: string) => {
      doc.setFontSize(13);
      doc.text(`[ Day: ${day} ]`, 20, y);
      y += 8;

      rosterResult.tasks.forEach((task: string) => {
        const assigned = rosterResult.roster[day]?.[task] || [];
        doc.setFontSize(10);
        doc.text(`   - ${task}: ${assigned.join(', ') || 'No duty'}`, 25, y);
        y += 6;
      });

      y += 4;
      if (y > 180) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`Duty_Roster_${Date.now()}.pdf`);
  };

  return (
    <div className="flex-1 flex flex-col pb-16">
      <Header
        title="🧹 ตารางจัดคิวทำเวร (Duty Roster Queue Generator)"
        subtitle="เครื่องมือช่วยครูจัดคิวทำเวรทำความสะอาดประจำวัน/สัปดาห์ หมุนเวียนนักเรียนเท่าเทียม พิมพ์ติดหน้าห้องเรียนได้ทันที"
      />

      <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Input Form */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-600" /> 1. รายชื่อนักเรียน (วางรายชื่อทีละบรรทัด)
          </h3>

          <textarea
            rows={6}
            value={studentText}
            onChange={(e) => setStudentText(e.target.value)}
            placeholder="คัดลอกรายชื่อนักเรียนมาวางที่นี่..."
            className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          {/* Tasks Setup */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purpleBrand-600" /> 2. รายการหน้าที่ทำเวร
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={customTaskInput}
                onChange={(e) => setCustomTaskInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="เพิ่มหน้าที่เวรใหม่ เช่น เวรรดน้ำต้นไม้..."
                className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs"
              />
              <button
                type="button"
                onClick={handleAddTask}
                className="px-4 py-2.5 bg-slate-800 text-white text-xs font-semibold rounded-xl"
              >
                + เพิ่มหน้าที่
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tasks.map((task) => (
                <span
                  key={task}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purpleBrand-50 border border-purpleBrand-200 text-purpleBrand-800 text-xs font-semibold rounded-xl"
                >
                  <span>{task}</span>
                  <button
                    onClick={() => handleRemoveTask(task)}
                    className="text-purpleBrand-400 hover:text-rose-600 font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleGenerateRoster}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-brand-600 via-brand-700 to-purpleBrand-600 text-white font-bold text-xs rounded-2xl shadow hover:opacity-95 disabled:opacity-50 transition"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>[ 🧹 สั่งคำนวณและจัดคิวทำเวรอัตโนมัติ ]</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Weekly Duty Roster Table */}
        {rosterResult && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">{rosterResult.title}</h3>
                <p className="text-xs text-slate-500 font-medium">หมุนเวียนคิวทำเวรประจำวันอย่างเท่าเทียม</p>
              </div>

              <button
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-black transition"
              >
                <Printer className="w-4 h-4" /> พิมพ์ตารางเวร (PDF)
              </button>
            </div>

            {/* Duty Roster Weekly Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b">
                    <th className="p-3 font-bold border-r w-32">วันประจำสัปดาห์</th>
                    {rosterResult.tasks.map((task: string) => (
                      <th key={task} className="p-3 font-bold border-r">
                        {task}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rosterResult.days.map((day: string) => (
                    <tr key={day} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-brand-700 bg-brand-50/40 border-r">{day}</td>
                      {rosterResult.tasks.map((task: string) => {
                        const assignedList: string[] = rosterResult.roster[day]?.[task] || [];
                        return (
                          <td key={task} className="p-3 border-r align-top space-y-1">
                            {assignedList.map((name, idx) => (
                              <div key={idx} className="font-semibold text-slate-800 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block" />
                                {name}
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
