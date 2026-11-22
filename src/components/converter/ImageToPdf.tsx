'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import { Upload, ArrowUp, ArrowDown, Trash2, Download, FileImage, Sparkles } from 'lucide-react';

export function ImageToPdfConverter() {
  const [imageFiles, setImageFiles] = useState<{ id: string; file: File; previewUrl: string }[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      const newImages = filesArr.map((file) => ({
        id: `img-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setImageFiles((prev) => [...prev, ...newImages]);
    }
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= imageFiles.length) return;
    const updated = [...imageFiles];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setImageFiles(updated);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGeneratePdf = async () => {
    if (imageFiles.length === 0) return;
    setIsGenerating(true);

    try {
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: pageSize,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < imageFiles.length; i++) {
        if (i > 0) pdf.addPage();

        const imgData = await getBase64(imageFiles[i].file);
        
        // Calculate image aspect ratio fitting page
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pageWidth - 20; // 10mm margins
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        let finalWidth = pdfWidth;
        let finalHeight = pdfHeight;
        if (pdfHeight > pageHeight - 20) {
          finalHeight = pageHeight - 20;
          finalWidth = (imgProps.width * finalHeight) / imgProps.height;
        }

        const xPos = (pageWidth - finalWidth) / 2;
        const yPos = (pageHeight - finalHeight) / 2;

        pdf.addImage(imgData, 'JPEG', xPos, yPos, finalWidth, finalHeight);
      }

      pdf.save(`combined_images_${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileImage className="w-4 h-4 text-brand-600" /> อัปโหลดรูปภาพเพื่อรวมเป็น PDF
        </h3>

        <label className="border-2 border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/20 hover:bg-brand-50/50 rounded-3xl p-8 text-center transition cursor-pointer flex flex-col items-center space-y-3 block">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              คลิกหรือลากไฟล์รูปภาพมาวางที่นี่ (PNG / JPG / JPEG)
            </p>
            <p className="text-xs text-slate-400 mt-1">สามารถเลือกได้หลายภาพพร้อมกัน</p>
          </div>
          <input
            type="file"
            multiple
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

      {imageFiles.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block mb-1.5">วางแนวหน้า PDF</label>
              <select
                value={orientation}
                onChange={(e: any) => setOrientation(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="portrait">แนวตั้ง (Portrait)</option>
                <option value="landscape">แนวนอน (Landscape)</option>
              </select>
            </div>
            <div>
              <label className="block mb-1.5">ขนาดกระดาษ</label>
              <select
                value={pageSize}
                onChange={(e: any) => setPageSize(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="a4">A4 (มาตรฐาน)</option>
                <option value="letter">Letter</option>
              </select>
            </div>
          </div>

          {/* Re-orderable Image List */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-800">จัดลำดับรูปภาพ ({imageFiles.length} ภาพ):</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imageFiles.map((item, idx) => (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 relative text-center">
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-800 text-white text-[10px] font-bold">
                    หน้า {idx + 1}
                  </span>
                  <img src={item.previewUrl} alt={`Image ${idx + 1}`} className="w-full h-32 object-cover rounded-xl border" />
                  <div className="flex items-center justify-center gap-1 pt-1">
                    <button
                      onClick={() => moveImage(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveImage(idx, 'down')}
                      disabled={idx === imageFiles.length - 1}
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeImage(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-brand-600 to-purpleBrand-600 text-white font-bold text-xs rounded-2xl shadow hover:opacity-95 disabled:opacity-50 transition"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>[ รวมรูปภาพเป็นไฟล์ PDF เดียว ]</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
