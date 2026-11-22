'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import {
  Upload,
  Scissors,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  UserCheck,
  RefreshCw,
  Sparkles,
  Search,
} from 'lucide-react';

interface ExtractedPageItem {
  pageIndex: number; // 0-based
  pageNumber: number; // 1-based
  detectedName: string;
  rawSnippet: string;
  isCustomized?: boolean;
}

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

export function PdfNameSplitter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [extractedPages, setExtractedPages] = useState<ExtractedPageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [namingPattern, setNamingPattern] = useState<'name_only' | 'index_name' | 'doc_name'>(
    'index_name'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkNamesInput, setBulkNamesInput] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply batch list of names line-by-line to pages
  const handleApplyBulkNames = () => {
    if (!bulkNamesInput.trim()) return;

    const names = bulkNamesInput
      .split(/[\n\r\,]+/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (names.length === 0) return;

    setExtractedPages((prev) =>
      prev.map((item, idx) => {
        if (idx < names.length) {
          return {
            ...item,
            detectedName: names[idx],
            isCustomized: true,
          };
        }
        return item;
      })
    );

    setShowBulkModal(false);
    setBulkNamesInput('');
  };

  // Helper function to extract Thai/English full names from text
  const extractPersonNameFromText = (text: string, pageNum: number): string => {
    if (!text || !text.trim()) return `บุคคล_คนที่_${pageNum}`;

    // Normalize text Unicode NFC and strip repetitive dots, dashes, underscores, ellipses
    const cleanText = text
      .normalize('NFC')
      .replace(/[\.\_\-\–\—\…]{2,}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const THAI_WORD = '[\\u0E00-\\u0E7Fa-zA-Z]+';

    // 1. Specific Candidate Label Pattern (e.g. "ชื่อ – สกุล ผู้เข้ารับการทดสอบ จุธิมา เพ็ชรพราย", "ชื่อ-สกุล : นายสมชาย ใจดี")
    const labelRegex = new RegExp(
      `(?:ชื่อ\\s*[\\-\\–\\—\\:\\.]?\\s*สกุล|ชื่อ\\s*ผู้เข้ารับการทดสอบ|ชื่อ\\s*ผู้ทดสอบ|ชื่อ\\s*นักเรียน|ชื่อ\\s*ผู้ได้รับ|ชื่อ\\s*-\\s*นามสกุล|ชื่อ\\s*นามสกุล|ชื่อ\\s*ผู้สมัคร|ชื่อ)\\s*(?:ผู้เข้ารับการทดสอบ|ผู้ทดสอบ|ผู้รับการทดสอบ|ผู้ได้รับ|นักเรียน|ผู้สมัคร)?\\s*[\\:\\.\\s\\_\\-\\–]*\\s*((?:นาย|นาง|นางสาว|น\\.ส\\.|เด็กชาย|เด็กหญิง|ด\\.ช\\.|ด\\.ญ\\.|ดร\\.|คุณ|พระ|สามเณร|${THAI_WORD})\\s+${THAI_WORD}(?:\\s+${THAI_WORD})?)`,
      'i'
    );
    const labelMatch = cleanText.match(labelRegex);
    if (labelMatch && labelMatch[1]) {
      const name = sanitizeExtractedName(labelMatch[1]);
      if (
        name &&
        name.length > 2 &&
        !name.startsWith('ผู้เข้ารับ') &&
        !name.startsWith('ผู้ทดสอบ')
      ) {
        return name;
      }
    }

    // 2. Direct Candidate Line Pattern: "ผู้เข้ารับการทดสอบ จุธิมา เพ็ชรพราย"
    const candidateLineRegex = new RegExp(
      `(?:ผู้เข้ารับการทดสอบ|ผู้รับการทดสอบ|ผู้ทดสอบ)\\s*[\\:\\.\\s\\_\\-\\–]*\\s*(${THAI_WORD}\\s+${THAI_WORD}(?:\\s+${THAI_WORD})?)`,
      'i'
    );
    const candidateMatch = cleanText.match(candidateLineRegex);
    if (candidateMatch && candidateMatch[1]) {
      const name = sanitizeExtractedName(candidateMatch[1]);
      if (name && name.length > 2) return name;
    }

    // 3. Thai Prefix Pattern (e.g. "นายสมชาย ใจดี", "นางสาวจุธิมา เพ็ชรพราย", "ด.ช. สมศักดิ์ มีสุข")
    const prefixRegex = new RegExp(
      `(?:นาย|นางสาว|นาง|เด็กชาย|เด็กหญิง|ด\\.ช\\.|ด\\.ญ\\.|น\\.ส\\.|ดร\\.|คุณ|พระ|สามเณร)\\s*(${THAI_WORD}(?:\\s+${THAI_WORD})+|${THAI_WORD})`,
      'i'
    );
    const prefixMatch = cleanText.match(prefixRegex);
    if (prefixMatch && prefixMatch[0]) {
      const name = sanitizeExtractedName(prefixMatch[0]);
      if (name && name.length > 2) return name;
    }

    // 4. Fallback: Search for consecutive Thai words
    const thaiWordsMatches = cleanText.match(
      /[\u0E00-\u0E7F]{2,}(?:\s+[\u0E00-\u0E7F]{2,})+|[a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,})+/g
    );
    if (thaiWordsMatches) {
      for (const candidate of thaiWordsMatches) {
        const name = sanitizeExtractedName(candidate);
        if (
          name &&
          name.length > 3 &&
          !name.includes('วิทยาลัย') &&
          !name.includes('มาตรฐาน') &&
          !name.includes('กรมพัฒนา') &&
          !name.includes('กระทรวง') &&
          !name.includes('ทดสอบ') &&
          !name.includes('หนังสือ') &&
          !name.includes('รายงาน') &&
          !name.includes('ผลการ') &&
          !name.includes('ศูนย์การ') &&
          !name.includes('ลงชื่อ')
        ) {
          return name;
        }
      }
    }

    return `บุคคล_คนที่_${pageNum}`;
  };

  // Helper to sanitize extracted name strings for clean filenames
  const sanitizeExtractedName = (rawName: string): string => {
    if (!rawName) return '';
    let cleaned = rawName
      .replace(/[\_\-\.\:\,\"\/\'\=\(\)\[\]\{\}\<\>]/g, ' ')
      .replace(
        /(?:ผู้เข้ารับการทดสอบ|ผู้ทดสอบ|ผู้ผ่านการทดสอบ|เลขประจำตัว|หมายเลข|สถานที่|ระดับ|คะแนน|วันที่|พ\.ศ\.|ลำดับ|สาขาอาชีพ|ศูนย์ทดสอบ|สถาบัน)/gi,
        ''
      )
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned;
  };

  // Format file name based on pattern preference
  const getFormattedFileName = (item: ExtractedPageItem): string => {
    const rawName = (item.detectedName || `บุคคล_${item.pageNumber}`).trim();
    const safeName = rawName.replace(/[\/\\:\*\?\"<>\|]/g, '_');
    const indexStr = String(item.pageNumber).padStart(2, '0');

    if (namingPattern === 'name_only') {
      return `${safeName}.pdf`;
    } else if (namingPattern === 'doc_name') {
      const baseDoc = selectedFile?.name.replace(/\.pdf$/i, '') || 'เอกสาร';
      return `${safeName}_${baseDoc}.pdf`;
    } else {
      // index_name (default)
      return `${indexStr}_${safeName}.pdf`;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setSelectedFile(file);
    setIsProcessing(true);
    setExtractedPages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadedPdf = await PDFDocument.load(arrayBuffer);
      setPdfDoc(loadedPdf);

      const pageCount = loadedPdf.getPageCount();
      setTotalPages(pageCount);

      // Dynamically load pdf.js via browser script to avoid bundler canvas dependency issues
      const pdfjsLib = await loadPdfJsScript();
      const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const pagesInfo: ExtractedPageItem[] = [];

      for (let i = 0; i < pageCount; i++) {
        const pageNumber = i + 1;
        let pageText = '';

        try {
          const pdfjsPage = await pdfjsDoc.getPage(pageNumber);
          const textContent = await pdfjsPage.getTextContent();
          pageText = textContent.items.map((item: any) => item.str).join(' ');
        } catch (textErr) {
          console.warn(`Could not extract text layer for page ${pageNumber}`, textErr);
        }

        const detectedName = extractPersonNameFromText(pageText, pageNumber);
        const snippet = pageText
          ? pageText.substring(0, 120) + '...'
          : '(ไม่พบข้อความดิจิทัล - ใช้วิธีก๊อปปี้วางรายชื่อวางได้ทันที)';

        pagesInfo.push({
          pageIndex: i,
          pageNumber,
          detectedName,
          rawSnippet: snippet,
        });
      }

      setExtractedPages(pagesInfo);
      // Automatically open bulk paste panel so teachers can paste names instantly
      setShowBulkModal(true);
    } catch (err) {
      console.error('PDF parsing error:', err);
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์ PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateName = (pageIndex: number, newName: string) => {
    setExtractedPages((prev) =>
      prev.map((item) =>
        item.pageIndex === pageIndex
          ? { ...item, detectedName: newName, isCustomized: true }
          : item
      )
    );
  };

  // Single Page Split & Download
  const handleDownloadSinglePage = async (item: ExtractedPageItem) => {
    if (!pdfDoc) return;
    try {
      const singleDoc = await PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(pdfDoc, [item.pageIndex]);
      singleDoc.addPage(copiedPage);

      const pdfBytes = await singleDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = getFormattedFileName(item);
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกไฟล์');
    }
  };

  // Download All Split Pages as ZIP Bundle
  const handleDownloadZipAll = async () => {
    if (!pdfDoc || extractedPages.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();

      for (const item of extractedPages) {
        const singleDoc = await PDFDocument.create();
        const [copiedPage] = await singleDoc.copyPages(pdfDoc, [item.pageIndex]);
        singleDoc.addPage(copiedPage);

        const pdfBytes = await singleDoc.save();
        const fileName = getFormattedFileName(item);
        zip.file(fileName, pdfBytes);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);

      const baseName = selectedFile?.name.replace(/\.pdf$/i, '') || 'เอกสารแยกรายบุคคล';
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}_แยกรายบุคคล_ครบทุกหน้า.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation error:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Header Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-brand-600" /> อัปโหลด PDF เพื่อแยกไฟล์รายบุคคล & ตรวจจับชื่ออัตโนมัติ
          </h3>

          {selectedFile && (
            <button
              onClick={() => {
                setSelectedFile(null);
                setPdfDoc(null);
                setExtractedPages([]);
              }}
              className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> เปลี่ยนไฟล์ PDF
            </button>
          )}
        </div>

        {!selectedFile ? (
          <label className="border-2 border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/20 hover:bg-brand-50/50 rounded-3xl p-10 text-center transition cursor-pointer flex flex-col items-center space-y-3 block">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center shadow-xs">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">
                คลิกหรือลากไฟล์ PDF เอกสารรวมหลายหน้ามาวางที่นี่
              </p>
              <p className="text-xs text-slate-500 mt-1">
                เช่น ใบสรุปคะแนนมาตรฐานฝีมือแรงงาน, ใบประกาศนียบัตร, ใบแจ้งผลสอบ, สลิป หรือแบบฟอร์มที่มีชื่อคนต่างกันในแต่ละหน้า
              </p>
            </div>
            <input
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                PDF
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">
                  จำนวนทั้งหมด: <span className="font-bold text-brand-700">{totalPages} หน้า</span> • ขนาดไฟล์: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            {isProcessing ? (
              <div className="flex items-center gap-2 text-xs font-bold text-brand-700 bg-brand-50 px-3.5 py-2 rounded-xl border border-brand-200">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                กำลังโหลดข้อมูลหน้าเอกสาร PDF...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadZipAll}
                  disabled={isZipping || extractedPages.length === 0}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                >
                  {isZipping ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> กำลังบีบอัด ZIP...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> 📦 ดาวน์โหลดไฟล์ทั้งหมดเป็น ZIP
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pages Preview & Edit Table */}
      {selectedFile && !isProcessing && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" /> รายการชื่อ-นามสกุล ที่ตรวจจับได้ในแต่ละหน้า ({extractedPages.length} หน้า)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ตรวจสอบและแก้ไขชื่อ-นามสกุลในช่องข้อความได้ทันที ชื่อที่ระบุจะถูกนำไปใช้เป็นชื่อไฟล์ PDF
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Bulk Paste Names Button */}
              <button
                onClick={() => setShowBulkModal(!showBulkModal)}
                className="bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-brand-200 shadow-2xs transition"
              >
                <FileText className="w-3.5 h-3.5" /> 📋 วางรายชื่อรวมทั้งหมด
              </button>

              {/* Naming Pattern Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
                <span className="text-slate-500 text-[11px] pl-1">รูปแบบชื่อไฟล์:</span>
                <select
                  value={namingPattern}
                  onChange={(e: any) => setNamingPattern(e.target.value)}
                  className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold focus:outline-none"
                >
                  <option value="index_name">01_ชื่อ-นามสกุล.pdf</option>
                  <option value="name_only">ชื่อ-นามสกุล.pdf</option>
                  <option value="doc_name">ชื่อ-นามสกุล_ชื่อเอกสาร.pdf</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Paste Names Expandable Box */}
          {showBulkModal && (
            <div className="p-4 bg-brand-50/60 border border-brand-200 rounded-2xl space-y-3 animate-in fade-in duration-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-600" /> วางรายชื่อบุคคลแบบครั้งละหลายคน (ก๊อปปี้วางจาก Excel / Word ได้เลย)
                </h4>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  ✕ ปิด
                </button>
              </div>
              <p className="text-[11px] text-slate-600">
                คัดลอกรายชื่อ 1 บรรทัดต่อ 1 คน มาวางในช่องด้านล่าง ระบบจะแมตช์ใส่ชื่อในแต่ละหน้าให้อัตโนมัติเรียงตามลำดับ (บรรทัดที่ 1 ➔ หน้า 1, บรรทัดที่ 2 ➔ หน้า 2)
              </p>
              <textarea
                rows={5}
                value={bulkNamesInput}
                onChange={(e) => setBulkNamesInput(e.target.value)}
                placeholder={`จุธิมา เพ็ชรพราย\nสมชาย ใจดี\nนฤมล โสภา`}
                className="w-full p-3 rounded-xl border border-brand-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-2xs font-mono"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-600">
                  จำนวนชื่อที่ป้อน: <strong className="text-brand-700 font-bold">{bulkNamesInput.split(/[\n\r\,]+/).filter(n => n.trim()).length} ชื่อ</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleApplyBulkNames}
                    disabled={!bulkNamesInput.trim()}
                    className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> นำเข้าและใส่ชื่อในแต่ละหน้าทันที
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {extractedPages
              .filter(
                (item) =>
                  !searchQuery ||
                  item.detectedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  String(item.pageNumber).includes(searchQuery)
              )
              .map((item) => (
                <div
                  key={item.pageIndex}
                  className={`p-4 rounded-2xl border transition flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
                    item.isCustomized
                      ? 'bg-amber-50/40 border-amber-300'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1">
                    <span className="w-12 h-12 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex flex-col items-center justify-center flex-shrink-0 shadow-2xs">
                      <span className="text-[9px] text-slate-300 font-normal">หน้า</span>
                      {item.pageNumber}
                    </span>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700 flex-shrink-0">
                          ชื่อบุคคลประจำหน้า:
                        </label>
                        {item.detectedName.startsWith('บุคคล_') ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600" /> ตรวจไม่พบชื่ออัตโนมัติ (กรุณาแก้ไข)
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ตรวจพบชื่ออัตโนมัติ
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.detectedName}
                          onChange={(e) => handleUpdateName(item.pageIndex, e.target.value)}
                          placeholder="พิมพ์ ชื่อ-นามสกุล เพื่อตั้งเป็นชื่อไฟล์..."
                          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-2xs"
                        />
                      </div>

                      <p className="text-[11px] text-slate-400 italic flex flex-wrap items-center gap-x-2">
                        <span>ตัวอย่างชื่อไฟล์: <span className="font-mono text-slate-700 font-semibold">{getFormattedFileName(item)}</span></span>
                        {item.rawSnippet && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 not-italic">
                            📝 ข้อความที่อ่านได้: {item.rawSnippet}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                    <button
                      onClick={() => handleDownloadSinglePage(item)}
                      className="bg-white hover:bg-slate-100 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-300 shadow-2xs transition"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-600" /> ดาวน์โหลด PDF หน้าเดียว
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              รวมทั้งหมด {extractedPages.length} รายการ PDF แยกรายบุคคล
            </span>

            <button
              onClick={handleDownloadZipAll}
              disabled={isZipping || extractedPages.length === 0}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> กำลังบีบอัด ZIP...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> 📦 ดาวน์โหลดไฟล์ทั้งหมดเป็น ZIP
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
