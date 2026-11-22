'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { StorageManager } from '@/lib/storage';
import { ContentItem, ContentProfile } from '@/types';
import {
  Search,
  Plus,
  Trash2,
  Edit,
  FileQuestion,
  FileText,
  Target,
  BookMarked,
  FileCode,
} from 'lucide-react';
import { CuteBooksIcon } from '@/components/icons/CuteIcons';

export default function ContentLibraryPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [profiles, setProfiles] = useState<ContentProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  useEffect(() => {
    setContents(StorageManager.getContents());
    setProfiles(StorageManager.getProfiles());
  }, []);

  const handleDelete = (id: string) => {
    StorageManager.deleteContent(id);
    setContents(StorageManager.getContents());
  };

  const filtered = contents.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'ALL' || c.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const subjects = Array.from(new Set(contents.map((c) => c.subject))).filter(Boolean);

  return (
    <div className="flex-1 flex flex-col pb-16">
      <Header
        title="📚 คลังเนื้อหา (Content Library)"
        subtitle="ศูนย์รวมเนื้อหาบทเรียนที่อัปโหลดและวิเคราะห์แล้วสำหรับนำไปสร้างสื่อการสอน"
      />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Search & Filter Bar */}
        <div className="cute-card flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-violet-400 absolute left-4 top-3" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อเรื่อง วิชา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-sky-100 bg-sky-50/40 focus:bg-white text-xs focus:outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-300 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-4 py-2.5 rounded-full border border-sky-100 text-xs font-bold text-slate-700 focus:outline-none bg-sky-50/50"
            >
              <option value="ALL">ทุกกลุ่มวิชา ({contents.length})</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            <Link
              href="/upload"
              className="cute-pill-btn inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> เพิ่มเนื้อหาใหม่
            </Link>
          </div>
        </div>

        {/* Content Items List Grid */}
        {filtered.length === 0 ? (
          <div className="cute-card p-12 text-center space-y-3">
            <CuteBooksIcon className="w-16 h-16 mx-auto drop-shadow-sm" />
            <p className="text-base font-bold text-slate-800">ยังไม่มีรายการเนื้อหาในคลัง</p>
            <p className="text-xs text-slate-500">เริ่มต้นด้วยการอัปโหลดไฟล์บทเรียนเพื่อให้ AI ช่วยวิเคราะห์และสร้างข้อสอบ</p>
            <Link
              href="/upload"
              className="cute-pill-btn inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold mt-2"
            >
              <Plus className="w-4 h-4" /> อัปโหลดเนื้อหาแรก
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => {
              const profile = profiles.find((p) => p.contentId === item.id);
              return (
                <div
                  key={item.id}
                  className="cute-card hover-card p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold">
                        {item.subject}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(item.createdAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-800 line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {item.rawText.substring(0, 120)}...
                    </p>
                  </div>

                  {/* Quick Creation Buttons */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {profile ? (
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                        <Link
                          href={`/content-profile/${profile.id}`}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-500" /> แก้ไข Profile
                        </Link>
                        <Link
                          href={`/questions?profileId=${profile.id}`}
                          className="px-2.5 py-1.5 bg-purpleBrand-50 hover:bg-purpleBrand-100 text-purpleBrand-700 rounded-xl flex items-center justify-center gap-1"
                        >
                          <FileQuestion className="w-3.5 h-3.5 text-purpleBrand-600" /> สร้างข้อสอบ
                        </Link>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600">รอวิเคราะห์เนื้อหา</p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">{item.fileCount} ไฟล์แนบ</span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 text-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
