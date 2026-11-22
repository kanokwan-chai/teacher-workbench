'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, Package, Sparkles, Loader2 } from 'lucide-react';

export function PdfCompressor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setOriginalSize(file.size);
      setCompressedSize(null);
    }
  };

  const handleCompressPdf = async () => {
    if (!selectedFile) return;
    setIsCompressing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Save PDF with stream compression
      const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setCompressedSize(blob.size);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name.replace(/\.pdf$/i, '')}_compressed.pdf`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-4 h-4 text-rose-600" /> อัปโหลดไฟล์ PDF เพื่อบีบอัดขนาดไฟล์
        </h3>

        <label className="border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/20 hover:bg-rose-50/50 rounded-3xl p-8 text-center transition cursor-pointer flex flex-col items-center space-y-3 block">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {selectedFile ? selectedFile.name : 'คลิกเพื่อเลือกไฟล์ PDF สำหรับบีบอัดขนาดไฟล์'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {selectedFile ? `ขนาดปัจจุบัน: ${(originalSize / 1024).toFixed(1)} KB` : 'เหมาะสำหรับไฟล์ขนาดใหญ่ก่อนส่งใน LINE / Google Classroom'}
            </p>
          </div>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {selectedFile && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">ระดับการบีบอัด (Compression Level)</label>
            <select
              value={compressionLevel}
              onChange={(e: any) => setCompressionLevel(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-semibold bg-white"
            >
              <option value="low">บีบอัดน้อย (Low - รักษาความคมชัดสูงสุด)</option>
              <option value="medium">บีบอัดปานกลาง (Medium - สมดุลระหว่างขนาดไฟล์และความคมชัด)</option>
              <option value="high">บีบอัดสูง (High - ลดขนาดไฟล์ให้เล็กที่สุด)</option>
            </select>
          </div>

          {compressedSize !== null && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-900">
              ✓ บีบอัดไฟล์สำเร็จ! ขนาดเดิม {(originalSize / 1024).toFixed(1)} KB ➔ ขนาดใหม่ {(compressedSize / 1024).toFixed(1)} KB (ลดลง {Math.max(0, Math.round((1 - compressedSize / originalSize) * 100))})%
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleCompressPdf}
              disabled={isCompressing}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow hover:opacity-95 disabled:opacity-50 transition"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>กำลังบีบอัดไฟล์ PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>[ บีบอัดไฟล์ PDF และดาวน์โหลด ]</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
