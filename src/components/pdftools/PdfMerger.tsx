'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, ArrowUp, ArrowDown, Trash2, Download, FileStack, Sparkles } from 'lucide-react';

export function PdfMerger() {
  const [pdfFiles, setPdfFiles] = useState<{ id: string; file: File; pageCount: number }[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      const newPdfItems: { id: string; file: File; pageCount: number }[] = [];

      for (const file of filesArr) {
        try {
          const buffer = await file.arrayBuffer();
          const doc = await PDFDocument.load(buffer);
          newPdfItems.push({
            id: `pdf-${Date.now()}-${Math.random()}`,
            file,
            pageCount: doc.getPageCount(),
          });
        } catch (err) {
          console.error('PDF load error:', err);
        }
      }

      setPdfFiles((prev) => [...prev, ...newPdfItems]);
    }
  };

  const movePdf = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pdfFiles.length) return;
    const updated = [...pdfFiles];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setPdfFiles(updated);
  };

  const removePdf = (index: number) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMergePdfs = async () => {
    if (pdfFiles.length === 0) return;
    setIsMerging(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of pdfFiles) {
        const buffer = await item.file.arrayBuffer();
        const srcDoc = await PDFDocument.load(buffer);
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged_document_${Date.now()}.pdf`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileStack className="w-4 h-4 text-brand-600" /> อัปโหลดไฟล์ PDF เพื่อนำมารวมเป็นเอกสารเดียว
        </h3>

        <label className="border-2 border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/20 hover:bg-brand-50/50 rounded-3xl p-8 text-center transition cursor-pointer flex flex-col items-center space-y-3 block">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              คลิกหรือลากไฟล์ PDF หลายๆ ไฟล์มาวางที่นี่
            </p>
            <p className="text-xs text-slate-400 mt-1">สามารถเลือกไฟล์ PDF ได้หลายไฟล์พร้อมกัน</p>
          </div>
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {pdfFiles.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-800">ลำดับไฟล์ PDF ที่จะรวมเข้าด้วยกัน ({pdfFiles.length} ไฟล์):</h4>

          <div className="space-y-2">
            {pdfFiles.map((item, idx) => (
              <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-brand-600 w-6 text-center">#{idx + 1}</span>
                  <div>
                    <p className="font-bold text-slate-800">{item.file.name}</p>
                    <p className="text-[11px] text-slate-400">จำนวน {item.pageCount} หน้า | {(item.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => movePdf(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => movePdf(idx, 'down')}
                    disabled={idx === pdfFiles.length - 1}
                    className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removePdf(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleMergePdfs}
              disabled={isMerging}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-brand-600 to-purpleBrand-600 text-white font-bold text-xs rounded-2xl shadow hover:opacity-95 disabled:opacity-50 transition"
            >
              {isMerging ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>[ รวมไฟล์ PDF ทั้งหมดเป็นเอกสารเดียว ]</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
