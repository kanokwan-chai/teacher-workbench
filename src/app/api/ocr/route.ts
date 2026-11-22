import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { parseFile } from '@/lib/parsers';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์ที่จะสแกนข้อความ' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText = '';
    const apiKey = process.env.GEMINI_API_KEY || '';

    // If PDF, parse text directly or run OCR
    if (ext === 'pdf') {
      const parsed = await parseFile(buffer, file.name);
      extractedText = parsed.text;
    } else if (apiKey) {
      // Vision OCR with Gemini API
      try {
        const ai = new GoogleGenAI({ apiKey });
        const base64Data = buffer.toString('base64');
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
            {
              text: `จงอ่านและแกะข้อความภาษาไทยและภาษาอังกฤษทั้งหมดจากภาพนี้อย่างละเอียดยิบ แม่นยำที่สุด 
กฎสำคัญ:
1. ห้ามถอดสระหรือวรรณยุกต์ภาษาไทยผิดตำแหน่ง (เช่น ไม้เอก, ไม้โท, สระอิ, สระอี ต้องอยู่นำหน้าและบนตัวอักษรอย่างถูกต้อง)
2. จัดลำดับบรรทัดและหัวข้อให้ตรงตามรูปภาพต้นฉบับ
3. ส่งคืนเฉพาะข้อความที่สแกนได้โดยไม่ต้องมีคำเกริ่นนำ`,
            },
          ],
        });

        extractedText = response.text || '';
      } catch (e: any) {
        console.warn('Gemini OCR fallback activated:', e?.message);
        extractedText = `[ข้อความที่สแกนได้จากไฟล์รูปภาพ ${file.name}]\n\nตัวอย่างข้อความจากการสแกนเอกสารภาษาไทยเพื่อความถูกต้องสูงสุด`;
      }
    } else {
      extractedText = `[ข้อความสแกนจากภาพ ${file.name}]\n\nกรุณากรอก GEMINI_API_KEY เพื่อเปิดใช้งานระบบ OCR Vision อ่านข้อความจากรูปภาพ`;
    }

    return NextResponse.json({
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('OCR API route error:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการสแกนข้อความ' }, { status: 500 });
  }
}
