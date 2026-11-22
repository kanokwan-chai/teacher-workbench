'use client';

import { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Upload, Download, Printer, Sparkles, Loader2 } from 'lucide-react';

export function PrintFormatter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [headerText, setHeaderText] = useState('เอกสารการสอบการเรียนรู้ - ห้ามทำซ้ำโดยไม่ได้รับอนุญาต');
  const [footerText, setFooterText] = useState('โรงเรียนสาธิตการศึกษา');
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [isFormatting, setIsFormatting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleFormatPdf = async () => {
    if (!selectedFile) return;
    setIsFormatting(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);
      const pages = pdfDoc.getPages();
      const pageCount = pages.length;

      // Try loading custom Thai font (Sarabun) via fontkit for proper Unicode support
      let customFont: any;
      try {
        pdfDoc.registerFontkit(fontkit);
        const fontUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sarabun/Sarabun-Regular.ttf';
        const fontRes = await fetch(fontUrl);
        if (fontRes.ok) {
          const fontBytes = await fontRes.arrayBuffer();
          customFont = await pdfDoc.embedFont(fontBytes);
        } else {
          customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        }
      } catch (err) {
        console.warn('Thai font embed fallback:', err);
        customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }

      // Safe text renderer function to prevent WinAnsi encoding crashes
      const getSafeText = (str: string) => {
        try {
          customFont.encodeText(str);
          return str;
        } catch {
          // If font cannot encode character (e.g. standard Helvetica with Thai), strip non-ASCII
          return str.replace(/[^\x00-\x7F]/g, '');
        }
      };

      pages.forEach((page, idx) => {
        const { width, height } = page.getSize();

        // Draw Header Line & Text
        if (headerText.trim()) {
          const safeHeader = getSafeText(headerText);
          if (safeHeader) {
            page.drawText(safeHeader, {
              x: 20,
              y: height - 15,
              size: 9,
              font: customFont,
              color: rgb(0.3, 0.3, 0.3),
            });
          }
          page.drawLine({
            start: { x: 20, y: height - 20 },
            end: { x: width - 20, y: height - 20 },
            thickness: 0.5,
            color: rgb(0.8, 0.8, 0.8),
          });
        }

        // Draw Footer Line & Text & Page Numbers
        if (footerText.trim() || showPageNumbers) {
          page.drawLine({
            start: { x: 20, y: 25 },
            end: { x: width - 20, y: 25 },
            thickness: 0.5,
            color: rgb(0.8, 0.8, 0.8),
          });

          if (footerText.trim()) {
            const safeFooter = getSafeText(footerText);
            if (safeFooter) {
              page.drawText(safeFooter, {
                x: 20,
                y: 12,
                size: 9,
                font: customFont,
                color: rgb(0.3, 0.3, 0.3),
              });
            }
          }

          if (showPageNumbers) {
            const pageStr = `Page ${idx + 1} of ${pageCount}`;
            page.drawText(pageStr, {
              x: width - 80,
              y: 12,
              size: 9,
              font: customFont,
              color: rgb(0.3, 0.3, 0.3),
            });
          }
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name.replace(/\.pdf$/i, '')}_print_ready.pdf`;
      a.click();
    } catch (e: any) {
      console.error(e);
      alert(`เกิดข้อผิดพลาดในการจัดหน้าพิมพ์: ${e?.message || e}`);
    } finally {
      setIsFormatting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Printer className="w-4 h-4 text-brand-600" /> จัดหน้า PDF พิมพ์พร้อมใช้ (Header / Footer / Page Numbers)
        </h3>

        {!selectedFile ? (
          <label className="border-2 border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/20 hover:bg-brand-50/50 rounded-3xl p-8 text-center transition cursor-pointer flex flex-col items-center space-y-3 block">
            <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                คลิกหรือลากไฟล์ PDF มาวางเพื่อใส่อักขระหัว/ท้ายกระดาษ
              </p>
              <p className="text-xs text-slate-400 mt-1">เลือกได้ 1 ไฟล์เอกสาร PDF</p>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-800 truncate max-w-md">
                📄 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                เปลี่ยนไฟล์
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ข้อความหัวกระดาษ (Header Text)
                </label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="เช่น เอกสารการสอบวิชาภาษาไทย"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ข้อความท้ายกระดาษ (Footer Text)
                </label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="เช่น โรงเรียน..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={showPageNumbers}
                onChange={(e) => setShowPageNumbers(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
              />
              <span className="text-xs font-semibold text-slate-700">
                แสดงเลขหน้าสไตล์มาตรฐาน (Page X of Y) มุมขวาด้านล่าง
              </span>
            </label>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleFormatPdf}
                disabled={isFormatting}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-xs transition disabled:opacity-50"
              >
                {isFormatting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> กำลังจัดหน้าพิมพ์...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> ประมวลผลและดาวน์โหลด PDF พิมพ์พร้อมใช้
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
