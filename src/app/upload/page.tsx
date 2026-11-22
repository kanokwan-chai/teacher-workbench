'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { StorageManager } from '@/lib/storage';
import { ContentItem, ContentFile } from '@/types';
import {
  Upload,
  FileText,
  Sparkles,
  X,
  AlertCircle,
  ClipboardPaste,
} from 'lucide-react';
import { QuotaNoticeModal } from '@/components/common/QuotaNoticeModal';
import { useGeminiQuotaNotice } from '@/lib/useGeminiQuotaNotice';

export default function UploadPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [rawText, setRawText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showTextModal, setShowTextModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { notice, closeNotice, handleFetchError } = useGeminiQuotaNotice();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!title.trim()) {
      setErrorMsg('กรุณากรอกชื่อเรื่อง/ชื่อบทเรียน');
      return;
    }
    if (!rawText.trim() && files.length === 0) {
      setErrorMsg('กรุณาอัปโหลดไฟล์ หรือ วางข้อความเนื้อหาที่จะวิเคราะห์');
      return;
    }

    setErrorMsg('');
    setIsAnalyzing(true);

    try {
      // Build FormData with all uploaded binary files and metadata
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subject', subject || 'ทั่วไป');
      formData.append('gradeLevel', gradeLevel);
      formData.append('rawText', rawText);

      files.forEach((file) => {
        formData.append('files', file);
      });

      // Send FormData to /api/analyze for Server-side Text Extraction & Gemini Analysis
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const { handled, errorMessage } = await handleFetchError(res, 'เกิดข้อผิดพลาดในการวิเคราะห์เนื้อหา');
        if (!handled) {
          throw new Error(errorMessage);
        }
        return;
      }

      const { profile: analyzedProfile, extractedText } = await res.json();

      // Save Content Item & Profile to Storage
      const fileList: ContentFile[] = files.map((f) => ({
        id: `file-${Date.now()}-${Math.random()}`,
        contentId: '',
        fileName: f.name,
        fileType: f.name.split('.').pop()?.toLowerCase() || 'file',
        fileSize: f.size,
        weightPercentage: Math.floor(100 / (files.length || 1)),
        createdAt: new Date().toISOString(),
      }));

      const newContent: ContentItem = {
        id: `cnt-${Date.now()}`,
        title,
        subject: subject || 'ทั่วไป',
        gradeLevel,
        rawText: extractedText || rawText,
        fileCount: files.length,
        status: 'analyzed',
        createdAt: new Date().toISOString(),
        files: fileList,
      };

      StorageManager.saveContent(newContent);

      const newProfile = {
        ...analyzedProfile,
        id: `cpf-${Date.now()}`,
        contentId: newContent.id,
        subject: subject || analyzedProfile.subject || 'ทั่วไป',
        topic: title || analyzedProfile.topic,
        gradeLevel,
        createdAt: new Date().toISOString(),
      };

      StorageManager.saveProfile(newProfile);

      // Redirect to Content Profile Editor
      router.push(`/content-profile/${newProfile.id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="➕ เพิ่มเนื้อหาเรียนใหม่"
        subtitle="Upload PDF / DOCX / PPTX → Server Extract Text → AI Analyze → Content Profile"
      />

      <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-500">
          <span className="text-brand-600 font-bold flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]">1</span>
            อัปโหลดไฟล์ (PDF/DOCX/PPTX)
          </span>
          <span className="text-slate-300">→</span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">2</span>
            Server อ่านไฟล์ & Gemini วิเคราะห์
          </span>
          <span className="text-slate-300">→</span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">3</span>
            สร้างข้อสอบ / ใบงาน
          </span>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Basic Form */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <h3 className="text-base font-bold text-slate-800">ข้อมูลเบื้องต้นของบทเรียน</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                วิชา <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="เช่น คณิตศาสตร์, ภาษาอังกฤษ, บัญชี"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                เรื่อง/ชื่อบทเรียน <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ตรรกศาสตร์เบื้องต้น, Cell Biology"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">ระดับชั้น</label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="เช่น ม.4, ปวช.1, ทั่วไป"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">อัปโหลดไฟล์เนื้อหา (จะถูกอ่านข้อความตัวละครทั้งหมด)</h3>
            <button
              type="button"
              onClick={() => setShowTextModal(!showTextModal)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition"
            >
              <ClipboardPaste className="w-4 h-4" />
              {showTextModal ? 'ซ่อนการวางข้อความ' : 'วางข้อความเอง'}
            </button>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/30 hover:bg-brand-50/60 rounded-3xl p-8 text-center transition cursor-pointer flex flex-col items-center space-y-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                ลากไฟล์มาวางที่นี่ หรือเลือกไฟล์จากเครื่อง
              </p>
              <p className="text-xs text-slate-400 mt-1">
                รองรับไฟล์ PDF / DOCX / PPTX / TXT / PNG / JPG
              </p>
            </div>
            <label className="px-4 py-2 bg-white border border-slate-200 shadow-2xs rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
              เลือกไฟล์จากเครื่อง
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Text Paste Area */}
          {showTextModal && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700">วางข้อความเนื้อหาบทเรียนเพิ่มเติม:</label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="คัดลอกข้อความจากหนังสือ สไลด์ หรือโน้ตย่อมาวางที่นี่..."
                className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans"
              />
            </div>
          )}

          {/* Uploaded File List */}
          {files.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-600">ไฟล์ที่เลือกไว้ ({files.length} ไฟล์):</p>
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-brand-600" />
                      <span className="font-semibold text-slate-800">{file.name}</span>
                      <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Submit */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-brand-600 via-brand-700 to-purpleBrand-600 text-white font-semibold text-sm rounded-2xl shadow-md hover:opacity-95 disabled:opacity-50 transition"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังส่งไฟล์ให้ Server อ่านข้อความและส่งให้ Gemini AI วิเคราะห์...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span>[ อ่านไฟล์ & วิเคราะห์เนื้อหาด้วย AI ]</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quota & Token Limit Modal */}
      <QuotaNoticeModal
        isOpen={notice.isOpen}
        onClose={closeNotice}
        errorType={notice.errorType}
        errorMessage={notice.errorMessage}
        retryAfterSeconds={notice.retryAfterSeconds}
        onRetry={handleAnalyze}
      />
    </div>
  );
}
