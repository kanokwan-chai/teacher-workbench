'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { Upload, Download, Scissors, FileStack, Sparkles } from 'lucide-react';

export function PdfSplitter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [splitRange, setSplitRange] = useState<string>('1-2, 3-4');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      try {
        const buffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(buffer);
        const count = pdfDoc.getPageCount();
        setPageCount(count);
        if (count <= 2) {
          setSplitRange('1, 2');
        } else {
          setSplitRange(`1-${Math.ceil(count / 2)}, ${Math.ceil(count / 2) + 1}-${count}`);
        }
      } catch (err) {
        console.error('PDF load error:', err);
      }
    }
  };

  const handleSplitPdf = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(buffer);
      const zip = new JSZip();

      // Parse range string (e.g. "1-2, 3-5, 6")
      const ranges = splitRange.split(',').map((r) => r.trim()).filter(Boolean);

      for (let idx = 0; idx < ranges.length; idx++) {
        const rangeStr = ranges[idx];
        let pageIndices: number[] = [];

        if (rangeStr.includes('-')) {
          const [start, end] = rangeStr.split('-').map((n) => parseInt(n.trim(), 10));
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= pageCount) pageIndices.push(i - 1);
            }
          }
        } else {
          const pageNum = parseInt(rangeStr, 10);
          if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pageCount) {
            pageIndices.push(pageNum - 1);
          }
        }

        if (pageIndices.length > 0) {
          const newPdf = await PDFDocument.create();
          const copiedPages = await newPdf.copyPages(srcDoc, pageIndices);
          copiedPages.forEach((p) => newPdf.addPage(p));
          const pdfBytes = await newPdf.save();
          zip.file(`${selectedFile.name.replace(/\.pdf$/i, '')}_part_${idx + 1}_(pages_${rangeStr}).pdf`, pdfBytes);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `${selectedFile.name.replace(/\.pdf$/i, '')}_split_files.zip`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Scissors className="w-4 h-4 text-purpleBrand-600" /> อัปโหลดไฟล์ PDF ที่ต้องการแยกหน้า
        </h3>

        <label className="border-2 border-dashed border-purpleBrand-200 hover:border-purpleBrand-400 bg-purpleBrand-50/20 hover:bg-purpleBrand-50/50 rounded-3xl p-8 text-center transition cursor-pointer flex flex-col items-center space-y-3 block">
          <div className="w-14 h-14 rounded-2xl bg-purpleBrand-100 text-purpleBrand-600 flex items-center justify-center">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {selectedFile ? `${selectedFile.name} (${pageCount} หน้า)` : 'คลิกเพื่อเลือกไฟล์ PDF สำหรับแยกหน้า'}
            </p>
            <p className="text-xs text-slate-400 mt-1">รองรับเอกสาร PDF ทั้งหมด</p>
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
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-800">กำหนดช่วงหน้าที่ต้องการแยกออกเป็นไฟล์ใหม่</h4>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              รูปแบบการแยก (คั่นด้วยเครื่องหมายจุลภาค ,)
            </label>
            <input
              type="text"
              value={splitRange}
              onChange={(e) => setSplitRange(e.target.value)}
              placeholder="เช่น 1-3, 4-5, 6"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono font-semibold"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              ตัวอย่าง: <code>1-3, 4-6</code> จะแยกออกเป็น 2 ไฟล์ (ไฟล์แรกคือหน้า 1-3 และไฟล์ที่สองคือหน้า 4-6)
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSplitPdf}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-purpleBrand-600 hover:bg-purpleBrand-700 text-white font-bold text-xs rounded-2xl shadow hover:opacity-95 disabled:opacity-50 transition"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>[ แยกหน้า PDF และดาวน์โหลดเป็น ZIP ]</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
