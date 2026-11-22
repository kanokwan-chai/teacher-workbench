'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  Upload,
  Trash2,
  Download,
  Loader2,
  FileX,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Filter,
  CheckSquare,
  Square,
  ArrowRightLeft,
} from 'lucide-react';

const loadPdfJsScript = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR not supported'));
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjs);
      } else {
        reject(new Error('pdfjsLib initialization failed'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load pdf.min.js script'));
    document.head.appendChild(script);
  });
};

interface PageItem {
  pageNum: number; // 1-based
  dataUrl?: string;
}

export function PdfPageDeleter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [pagesToDelete, setPagesToDelete] = useState<number[]>([]); // 1-based page numbers
  const [rangeInput, setRangeInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setSelectedFile(file);
    setErrorMessage(null);
    setPagesToDelete([]);
    setRangeInput('');
    setIsLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const count = pdfDoc.getPageCount();
      setTotalPages(count);

      const pageItems: PageItem[] = Array.from({ length: count }, (_, i) => ({
        pageNum: i + 1,
      }));

      setPages(pageItems);

      // Render thumbnail previews using pdf.js
      try {
        const pdfjsLib = await loadPdfJsScript();
        const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

        const updatedPages: PageItem[] = [];
        for (let i = 1; i <= count; i++) {
          const page = await pdfjsDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            updatedPages.push({
              pageNum: i,
              dataUrl: canvas.toDataURL('image/png'),
            });
          } else {
            updatedPages.push({ pageNum: i });
          }
        }
        setPages(updatedPages);
      } catch (renderErr) {
        console.warn('Thumbnail rendering notice:', renderErr);
      }
    } catch (err) {
      console.error('PDF load error:', err);
      setErrorMessage('ไม่สามารถอ่านไฟล์ PDF ได้ กรุณาตรวจสอบว่าไฟล์ไม่เสียหาย');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle single page deletion
  const togglePageDelete = (pageNum: number) => {
    setPagesToDelete((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum]
    );
  };

  // Quick Select Helpers
  const selectOddPages = () => {
    const odds = pages.filter((p) => p.pageNum % 2 !== 0).map((p) => p.pageNum);
    setPagesToDelete(odds);
  };

  const selectEvenPages = () => {
    const evens = pages.filter((p) => p.pageNum % 2 === 0).map((p) => p.pageNum);
    setPagesToDelete(evens);
  };

  const selectAllPages = () => {
    setPagesToDelete(pages.map((p) => p.pageNum));
  };

  const clearSelection = () => {
    setPagesToDelete([]);
  };

  const invertSelection = () => {
    setPagesToDelete((prev) => pages.map((p) => p.pageNum).filter((p) => !prev.includes(p)));
  };

  // Apply Range Input (e.g., "1, 3-5, 8")
  const handleApplyRangeInput = () => {
    if (!rangeInput.trim()) return;
    const parts = rangeInput.split(',').map((s) => s.trim()).filter(Boolean);
    const marked = new Set<number>();

    parts.forEach((part) => {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr.trim(), 10);
        const end = parseInt(endStr.trim(), 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.min(start, end);
          const to = Math.max(start, end);
          for (let i = from; i <= to; i++) {
            if (i >= 1 && i <= totalPages) marked.add(i);
          }
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && num <= totalPages) {
          marked.add(num);
        }
      }
    });

    setPagesToDelete(Array.from(marked));
  };

  // Export PDF without deleted pages
  const handleExportPdf = async () => {
    if (!selectedFile) return;

    const remainingPages = pages.filter((p) => !pagesToDelete.includes(p.pageNum));

    if (remainingPages.length === 0) {
      setErrorMessage('ไม่สามารถลบทุกหน้าได้ เอกสาร PDF ใหม่ต้องมีอย่างน้อย 1 หน้า');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const newDoc = await PDFDocument.create();

      // Convert 1-based page numbers to 0-based indices for pdf-lib
      const indicesToKeep = remainingPages.map((p) => p.pageNum - 1);
      const copiedPages = await newDoc.copyPages(srcDoc, indicesToKeep);
      copiedPages.forEach((page) => newDoc.addPage(page));

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const baseName = selectedFile.name.replace(/\.pdf$/i, '');
      const downloadName = `${baseName}_deleted_pages.pdf`;

      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setErrorMessage('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF ใหม่');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setTotalPages(0);
    setPages([]);
    setPagesToDelete([]);
    setRangeInput('');
    setErrorMessage(null);
  };

  const remainingCount = totalPages - pagesToDelete.length;

  return (
    <div className="space-y-6">
      {/* Step 1: Upload Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileX className="w-4 h-4 text-rose-600" /> อัปโหลดไฟล์ PDF ที่ต้องการลบบางหน้าออก
        </h3>

        <label className="border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/20 hover:bg-rose-50/50 rounded-3xl p-8 text-center transition cursor-pointer flex flex-col items-center space-y-3 block">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {selectedFile
                ? `${selectedFile.name} (${totalPages} หน้า)`
                : 'คลิกหรือลากไฟล์ PDF เพื่อเริ่มเลือกและลบหน้า'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              รองรับไฟล์ PDF ทุกประเภท (เลือกคลิกหน้าที่จะลบ หรือกรอกช่วงหน้าได้ทันที)
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

      {isLoading && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-700">กำลังโหลดและพรีวิวตัวอย่างหน้าเอกสาร PDF...</p>
        </div>
      )}

      {/* Step 2: Page selection and controls */}
      {!isLoading && selectedFile && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          {/* Top Info & Summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                คลิกหน้าที่ต้องการลบออก หรือใช้ตัวช่วยเลือกด้านล่าง
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                คลิกที่ตัวอย่างหน้าเอกสารเพื่อตั้งค่าลบ/ยกเลิก (หน้าที่ถูกลบจะมีสัญลักษณ์ถังขยะและกรอบสีแดง)
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl">
              <div className="text-right">
                <p className="text-[11px] text-slate-500 font-semibold">สรุปการจัดการ</p>
                <p className="text-xs font-bold text-slate-800">
                  <span className="text-rose-600">ลบ {pagesToDelete.length} หน้า</span> |{' '}
                  <span className="text-emerald-600">คงเหลือ {remainingCount} หน้า</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Selection Toolbar */}
          <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            {/* Range input row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-rose-500/20">
                <Filter className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyRangeInput()}
                  placeholder="ระบุหน้าที่ต้องการลบ เช่น 1, 3-5, 8"
                  className="w-full text-xs outline-none bg-transparent font-semibold placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={handleApplyRangeInput}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                เลือกตามช่วง
              </button>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/60 text-xs font-semibold">
              <button
                onClick={selectOddPages}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 rounded-xl text-slate-700 transition"
              >
                เลือกหน้าคี่ (1, 3, 5...)
              </button>
              <button
                onClick={selectEvenPages}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 rounded-xl text-slate-700 transition"
              >
                เลือกหน้าคู่ (2, 4, 6...)
              </button>
              <button
                onClick={selectAllPages}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 rounded-xl text-slate-700 transition inline-flex items-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5 text-rose-500" />
                เลือกทั้งหมด
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 transition inline-flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 text-slate-400" />
                ยกเลิกทั้งหมด
              </button>
              <button
                onClick={invertSelection}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 transition inline-flex items-center gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                สลับการเลือก
              </button>
            </div>
          </div>

          {/* Grid of Pages */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[520px] overflow-y-auto p-1">
            {pages.map((p) => {
              const isMarkedDelete = pagesToDelete.includes(p.pageNum);

              return (
                <div
                  key={p.pageNum}
                  onClick={() => togglePageDelete(p.pageNum)}
                  className={`relative cursor-pointer group rounded-2xl border-2 transition-all duration-150 p-2.5 flex flex-col items-center select-none ${
                    isMarkedDelete
                      ? 'bg-rose-50/70 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-sm'
                  }`}
                >
                  {/* Status Badge Top Right */}
                  <div
                    className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      isMarkedDelete
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                    }`}
                  >
                    {isMarkedDelete ? <Trash2 className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-600" />}
                  </div>

                  {/* Thumbnail / Placeholder */}
                  <div className="w-full h-44 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200/80 relative">
                    {p.dataUrl ? (
                      <img
                        src={p.dataUrl}
                        alt={`Page ${p.pageNum}`}
                        className={`w-full h-full object-cover transition ${
                          isMarkedDelete ? 'opacity-40 grayscale blur-[0.5px]' : 'opacity-100'
                        }`}
                      />
                    ) : (
                      <div className="text-center p-3">
                        <span className="text-2xl font-black text-slate-300">#{p.pageNum}</span>
                        <p className="text-[10px] text-slate-400 mt-1">หน้า {p.pageNum}</p>
                      </div>
                    )}

                    {/* Overlay banner when marked to delete */}
                    {isMarkedDelete && (
                      <div className="absolute inset-0 bg-rose-950/30 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1 text-white">
                        <Trash2 className="w-8 h-8 text-rose-400 animate-bounce" />
                        <span className="text-xs font-bold bg-rose-600 px-2.5 py-0.5 rounded-full shadow-xs">
                          ลบหน้านี้
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Page Footer Label */}
                  <div className="mt-2 text-center">
                    <span
                      className={`text-xs font-bold ${
                        isMarkedDelete ? 'text-rose-600 line-through' : 'text-slate-700'
                      }`}
                    >
                      หน้า {p.pageNum}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error / Warning Alert */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {remainingCount === 0 && !errorMessage && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <span>คุณได้เลือกไว้ทั้งหมดทุกหน้า! เอกสาร PDF ใหม่ต้องมีอย่างน้อย 1 หน้าที่ถูกคงเหลือไว้</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-3 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-2xl transition inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>ล้างข้อมูล / เปลี่ยนไฟล์</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isProcessing || pagesToDelete.length === 0 || remainingCount === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs rounded-2xl shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>[ ตัดลบหน้า และดาวน์โหลด PDF ใหม่ ({remainingCount} หน้า) ]</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
