'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { StorageManager } from '@/lib/storage';
import { ContentItem } from '@/types';
import { Copy, Sparkles, CheckCircle2, ArrowRight, FileText } from 'lucide-react';
import { CuteOcrIcon, CuteLightbulbIcon } from '@/components/icons/CuteIcons';

export default function OcrScannerPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl('');
      }
    }
  };

  const handleScanText = async () => {
    if (!selectedFile) return;
    setIsScanning(true);
    setExtractedText('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setExtractedText(data.text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleCreateContentProfile = () => {
    const newContent: ContentItem = {
      id: `cnt-${Date.now()}`,
      title: `ข้อความสแกน: ${selectedFile?.name || 'เอกสาร'}`,
      subject: 'ทั่วไป',
      rawText: extractedText,
      fileCount: 1,
      status: 'uploaded',
      createdAt: new Date().toISOString(),
      files: [],
    };
    StorageManager.saveContent(newContent);
    router.push('/upload');
  };

  return (
    <div className="flex-1 flex flex-col pb-16">
      <Header
        title="🔍 OCR Text Extractor (สแกนแยกข้อความจากภาพ / PDF)"
        subtitle="ดึงข้อความตัวอักษรออกจากรูปภาพและเอกสารสแกน แม่นยำสูง สระและวรรณยุกต์ภาษาไทยไม่ลอย ไม่เพี้ยน"
      />

      <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Upload Zone */}
        <div className="cute-card p-6 sm:p-8 space-y-5">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2.5">
            <CuteOcrIcon className="w-7 h-7 shrink-0" />
            <span>อัปโหลดรูปภาพหรือ PDF ที่ต้องการสแกนข้อความ</span>
          </h3>

          <label className="border-2 border-dashed border-sky-300 hover:border-violet-400 bg-gradient-to-br from-sky-50/70 via-white to-violet-50/70 hover:from-sky-50 hover:to-violet-100/60 rounded-[26px] p-10 text-center transition-all cursor-pointer flex flex-col items-center space-y-3 group">
            <div className="w-18 h-18 rounded-3xl bg-white shadow-md border border-sky-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CuteOcrIcon className="w-12 h-12" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {selectedFile ? selectedFile.name : 'คลิกเพื่อเลือกไฟล์รูปภาพ (PNG/JPG) หรือ PDF'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                เน้นความถูกต้องของภาษาไทยและสระวรรณยุกต์ แกะข้อความได้แม่นยำสูง ✨
              </p>
            </div>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {selectedFile && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleScanText}
                disabled={isScanning}
                className="cute-pill-btn inline-flex items-center gap-2 px-8 py-3 font-bold text-xs sm:text-sm disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>AI กำลังแกะข้อความภาษาไทยแม่นยำสูง...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-200" />
                    <span>สแกนแกะข้อความออกจากภาพ</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* OCR Result Output */}
        {extractedText && (
          <div className="cute-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CuteLightbulbIcon className="w-6 h-6 shrink-0" />
                <span>ข้อความที่สแกนได้ ({extractedText.length} ตัวอักษร)</span>
              </h3>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-slate-700 text-xs font-bold rounded-full border border-sky-100 transition"
                >
                  {copySuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ'}</span>
                </button>

                <button
                  onClick={handleCreateContentProfile}
                  className="cute-pill-btn inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>นำข้อความไปสร้างงานสอน</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-sky-50/40 rounded-2xl border border-sky-100 font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
              {extractedText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
