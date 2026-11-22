'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { OMRStore } from '@/lib/omr/omrStore';
import { seedDemoData } from '@/lib/omr/demoData';
import { Student, Exam, ScanRecord } from '@/lib/omr/types';
import {
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  Award,
  BarChart3,
  Sparkles,
  QrCode,
  Scan,
  Printer,
  ChevronRight,
  TrendingUp,
  Trash2,
  Database,
  Link2,
} from 'lucide-react';

export default function OMRDashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  const loadData = async () => {
    setIsSupabaseConnected(OMRStore.isSupabaseConnected());
    const stds = await OMRStore.fetchStudentsAsync();
    const exms = await OMRStore.fetchExamsAsync();
    const scns = await OMRStore.fetchScansAsync();

    setStudents(stds);
    setExams(exms);
    setScans(scns);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedDemo = () => {
    seedDemoData();
    loadData();
    alert('โหลดข้อมูลตัวอย่าง (Demo Data) 10 นักเรียน + ข้อสอบ 40 ข้อ (ชุด A,B,C,D) เรียบร้อยแล้ว!');
  };

  const handleClearAllData = () => {
    if (confirm('คุณต้องการลบข้อมูลจำลองทั้งหมดในระบบออกเพื่อเริ่มใช้งานจริงหรือไม่?')) {
      OMRStore.clearAllData();
      loadData();
      alert('ลบข้อมูลจำลองออกทั้งหมดเรียบร้อยแล้ว ระบบพร้อมสำหรับการเชื่อมต่อและใช้งานจริง!');
    }
  };

  // Stats
  const totalScans = scans.length;
  const needsReviewCount = scans.filter(
    (s) => s.scan_status === 'LOW_CONFIDENCE' || s.scan_status === 'NEEDS_REVIEW'
  ).length;

  const avgPercentage =
    totalScans > 0
      ? (scans.reduce((sum, s) => sum + s.percentage, 0) / totalScans).toFixed(1)
      : '0.0';

  const passCount = scans.filter((s) => s.percentage >= 50).length;
  const passRate = totalScans > 0 ? ((passCount / totalScans) * 100).toFixed(1) : '0.0';

  const highestScore = totalScans > 0 ? Math.max(...scans.map((s) => s.total_score)) : 0;
  const lowestScore = totalScans > 0 ? Math.min(...scans.map((s) => s.total_score)) : 0;

  return (
    <div className="flex-1 flex flex-col pb-16 font-sans">
      <Header
        title="📊 OMR Exam Dashboard & Analytics"
        subtitle="ระบบสร้างและตรวจข้อสอบกระดาษอัตโนมัติด้วย OMR แบบ Deterministic ปลอดภัย แม่นยำ ไม่เดาคำตอบ"
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Supabase Connection Status Bar */}
        <div
          className={`p-4 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
            isSupabaseConnected
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                isSupabaseConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold">
                  {isSupabaseConnected
                    ? '🟢 เชื่อมต่อฐานข้อมูล Supabase PostgreSQL สำเร็จ (Live Cloud Database)'
                    : '🟡 ยังไม่ได้เชื่อมต่อ Supabase Database (กำลังใช้ Local Offline Store)'}
                </h4>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isSupabaseConnected
                  ? 'ข้อมูลนักเรียน ข้อสอบ และผลการตรวจจะถูกบันทึกลงใน Supabase Cloud โดยอัตโนมัติ'
                  : 'ระบุ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ในหน้า Settings เพื่อเปิดใช้ฐานข้อมูล Cloud'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isSupabaseConnected && (
              <Link
                href="/settings"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <Link2 className="w-3.5 h-3.5" /> ตั้งค่าเชื่อมต่อ Supabase
              </Link>
            )}

            <button
              onClick={handleClearAllData}
              className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> ล้างข้อมูลจำลองทั้งหมด
            </button>
          </div>
        </div>

        {/* Banner Welcome */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-brand-700 to-purpleBrand-700 p-6 md:p-8 text-white shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Deterministic Computer Vision OMR Engine</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                ศูนย์รวมการสร้างข้อสอบและตรวจกระดาษ OMR
              </h1>
              <p className="text-white/80 text-xs md:text-sm leading-relaxed">
                สร้างกระดาษคำตอบพร้อม QR Code & 4 Anchor Markers สลับชุดข้อสอบ A-B-C-D ตรวจจับภาพเอียงด้วย Perspective Transform และคำนวณคะแนนทันที
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSeedDemo}
                className="bg-white/15 hover:bg-white/25 text-white font-bold py-2.5 px-4 rounded-2xl text-xs backdrop-blur-md border border-white/20 flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" /> โหลด Demo ทดสอบ
              </button>
              <Link
                href="/omr/scan"
                className="bg-white text-brand-900 hover:bg-slate-50 font-bold py-2.5 px-6 rounded-2xl text-xs shadow transition flex items-center gap-2"
              >
                <Scan className="w-4 h-4 text-brand-600" /> สแกนตรวจข้อสอบ OMR
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Link
            href="/omr/dashboard"
            className="p-4 rounded-2xl bg-brand-50 border border-brand-200 text-brand-900 flex flex-col items-center justify-center text-center space-y-2 group shadow-xs hover:bg-brand-100/60 transition"
          >
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <span className="text-xs font-bold">Dashboard</span>
          </Link>

          <Link
            href="/omr/students"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 text-slate-800 flex flex-col items-center justify-center text-center space-y-2 group shadow-xs hover:bg-slate-50 transition"
          >
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-bold">นักเรียน ({students.length})</span>
          </Link>

          <Link
            href="/omr/exams"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 text-slate-800 flex flex-col items-center justify-center text-center space-y-2 group shadow-xs hover:bg-slate-50 transition"
          >
            <FileText className="w-5 h-5 text-purpleBrand-600" />
            <span className="text-xs font-bold">ข้อสอบ ({exams.length})</span>
          </Link>

          <Link
            href="/omr/generator"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 text-slate-800 flex flex-col items-center justify-center text-center space-y-2 group shadow-xs hover:bg-slate-50 transition"
          >
            <Printer className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold">กระดาษ OMR</span>
          </Link>

          <Link
            href="/omr/scan"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 text-slate-800 flex flex-col items-center justify-center text-center space-y-2 group shadow-xs hover:bg-slate-50 transition"
          >
            <Scan className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold">ตรวจข้อสอบ</span>
          </Link>

          <Link
            href="/omr/review"
            className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center space-y-2 group shadow-xs transition ${
              needsReviewCount > 0
                ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
                : 'bg-white border-slate-200/80 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-bold">รอตรวจสอบ ({needsReviewCount})</span>
          </Link>

          <Link
            href="/omr/item-analysis"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 text-slate-800 flex flex-col items-center justify-center text-center space-y-2 group shadow-xs hover:bg-slate-50 transition"
          >
            <TrendingUp className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-bold">วิเคราะห์ข้อสอบ</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">กระดาษที่ตรวจแล้ว</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{totalScans} <span className="text-xs font-normal text-slate-500">ฉบับ</span></div>
            <p className="text-xs text-slate-500 font-medium">จากจำนวนนักเรียนทั้งหมด {students.length} คน</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">คะแนนเฉลี่ย</span>
              <Award className="w-5 h-5 text-brand-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{avgPercentage}%</div>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>สูงสุด: {highestScore} คะแนน</span>
              <span>ต่ำสุด: {lowestScore} คะแนน</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">อัตราการสอบผ่าน (≥50%)</span>
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{passRate}%</div>
            <p className="text-xs text-slate-500 font-medium">ผ่านเกณฑ์ {passCount} จาก {totalScans} คน</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">รอครูตรวจสอบ (Review)</span>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-amber-600">{needsReviewCount} <span className="text-xs font-normal text-slate-500">ฉบับ</span></div>
            <p className="text-xs text-slate-500 font-medium">กรณีฝนหลายตัวเลือก หรือภาพไม่ชัดเจน</p>
          </div>
        </div>

        {/* Recent Exam Results Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">📋 ตารางผลการตรวจข้อสอบล่าสุด</h3>
              <p className="text-xs text-slate-500">แสดงรายการกระดาษคำตอบที่สแกนแล้วเรียงตามคะแนน</p>
            </div>
            <Link
              href="/omr/scan"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              สแกนเพิ่ม <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">รหัสนักเรียน</th>
                  <th className="p-3">ชื่อ - นามสกุล</th>
                  <th className="p-3">ชั้นเรียน</th>
                  <th className="p-3 text-center">Paper ID / QR</th>
                  <th className="p-3 text-center">คะแนนที่ได้</th>
                  <th className="p-3 text-center">คิดเป็น %</th>
                  <th className="p-3 text-center">สถานะการตรวจ</th>
                  <th className="p-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      ยังไม่มีผลการตรวจข้อสอบในระบบ สแกนข้อสอบใหม่ หรือกดปุ่ม "โหลด Demo ทดสอบ" ด้านบน
                    </td>
                  </tr>
                ) : (
                  scans.map((sc) => {
                    const student = students.find((s) => s.id === sc.student_id);
                    const isPassed = sc.percentage >= 50;

                    return (
                      <tr key={sc.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-semibold text-slate-800">{student?.student_code || 'N/A'}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {student ? `${student.first_name} ${student.last_name}` : 'ไม่พบชื่อนักเรียน'}
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{student?.class_name || '-'}</td>
                        <td className="p-3 text-center font-mono text-[11px] text-brand-700 bg-brand-50/50 rounded-lg">
                          PAPER:{sc.paper_id}
                        </td>
                        <td className="p-3 text-center font-extrabold text-sm text-slate-900">
                          {sc.total_score} <span className="text-xs text-slate-400 font-normal">ข้อ</span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              isPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {sc.percentage}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {sc.scan_status === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> สำเร็จ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5" /> รอตรวจสอบ ({sc.review_count})
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Link
                            href={`/omr/review`}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline"
                          >
                            ดูรายละเอียด/ตรวจทาน ➔
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
