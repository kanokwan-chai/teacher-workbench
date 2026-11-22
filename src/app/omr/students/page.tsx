'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { OMRStore } from '@/lib/omr/omrStore';
import { Student } from '@/lib/omr/types';
import {
  Users,
  Plus,
  Search,
  FileSpreadsheet,
  Trash2,
  Edit2,
  X,
  Upload,
  UserCheck,
  Filter,
} from 'lucide-react';

export default function StudentManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form Fields
  const [studentCode, setStudentCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [className, setClassName] = useState('ม.4/1');

  const loadData = async () => {
    setStudents(OMRStore.getStudents());
    const fetched = await OMRStore.fetchStudentsAsync();
    if (fetched && fetched.length > 0) {
      setStudents(fetched);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setStudentCode(`STD-${Math.floor(1000 + Math.random() * 9000)}`);
    setFirstName('');
    setLastName('');
    setClassName('ม.4/1');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (st: Student) => {
    setEditingStudent(st);
    setStudentCode(st.student_code);
    setFirstName(st.first_name);
    setLastName(st.last_name);
    setClassName(st.class_name);
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentCode.trim() || !firstName.trim() || !lastName.trim()) {
      alert('กรุณากรอกข้อมูลนักเรียนให้ครบถ้วน');
      return;
    }

    // Check unique student code
    const existing = students.find(
      (s) => s.student_code === studentCode.trim() && s.id !== editingStudent?.id
    );
    if (existing) {
      alert(`รหัสนักเรียน ${studentCode} มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
      return;
    }

    OMRStore.saveStudent({
      id: editingStudent?.id,
      student_id: editingStudent?.student_id || `ID-${Date.now()}`,
      student_code: studentCode.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      class_name: className.trim(),
    });

    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`คุณต้องการลบข้อมูลนักเรียน "${name}" หรือไม่?`)) {
      OMRStore.deleteStudent(id);
      loadData();
    }
  };

  // CSV Import Simulation
  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        const lines = content.split('\n').filter((l) => l.trim());
        let imported = 0;

        lines.forEach((line, idx) => {
          if (idx === 0 && line.includes('code')) return; // Header
          const parts = line.split(',').map((p) => p.trim());
          if (parts.length >= 3) {
            const sCode = parts[0] || `STD-${Date.now()}-${idx}`;
            const fName = parts[1] || 'นักเรียน';
            const lName = parts[2] || `นามสกุล ${idx}`;
            const cName = parts[3] || 'ม.4/1';

            OMRStore.saveStudent({
              student_code: sCode,
              first_name: fName,
              last_name: lName,
              class_name: cName,
            });
            imported++;
          }
        });

        alert(`นำเข้าข้อมูลนักเรียนสำเร็จเรียบร้อย ${imported} รายการ`);
        loadData();
      };
      reader.readAsText(file);
    }
  };

  // Filtered List
  const uniqueClasses = Array.from(new Set(students.map((s) => s.class_name)));
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.student_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClass === 'ALL' || s.class_name === selectedClass;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="flex-1 flex flex-col pb-16 font-sans">
      <Header
        title="👥 Student Management (จัดการข้อมูลนักเรียน)"
        subtitle="เพิ่ม แก้ไข ลบ ค้นหา และนำเข้าข้อมูลนักเรียนผ่านไฟล์ CSV สำหรับพิมพ์กระดาษสอบ OMR"
      />

      <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Controls Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, นามสกุล, หรือรหัสนักเรียน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                >
                  <option value="ALL">ทุกห้องเรียน ({students.length})</option>
                  {uniqueClasses.map((c) => (
                    <option key={c} value={c}>
                      ห้อง {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer flex items-center gap-2 transition">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> นำเข้า CSV
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleOpenAddModal}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
              >
                <Plus className="w-4 h-4" /> เพิ่มนักเรียนใหม่
              </button>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">ลำดับ</th>
                  <th className="p-3">รหัสนักเรียน (student_code)</th>
                  <th className="p-3">ชื่อ - นามสกุล</th>
                  <th className="p-3">ชั้นเรียน (class_name)</th>
                  <th className="p-3">วันที่เพิ่ม</th>
                  <th className="p-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      ไม่พบข้อมูลนักเรียนตรงตามเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{st.student_code}</td>
                      <td className="p-3 font-bold text-slate-900">
                        {st.first_name} {st.last_name}
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {st.class_name}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {new Date(st.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(st)}
                          className="text-brand-600 hover:text-brand-800 p-1.5 transition"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(st.id, `${st.first_name} ${st.last_name}`)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 transition"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-brand-600" />
                {editingStudent ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสนักเรียน (student_code) *
                </label>
                <input
                  type="text"
                  required
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  placeholder="เช่น STD-6701"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">นามสกุล *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชั้นเรียน / ห้อง</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  placeholder="เช่น ม.4/1"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
