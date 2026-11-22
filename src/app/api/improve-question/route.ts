import { NextResponse } from 'next/server';
import { generateJSONResponse } from '@/lib/gemini';
import { Question } from '@/types';

export async function POST(req: Request) {
  try {
    const { question, actionCommand, topic, subject } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'ไม่พบข้อสอบที่ต้องการปรับปรุง' }, { status: 400 });
    }

    const systemInstruction = `คุณคือครูผู้เชี่ยวชาญด้านการปรับปรุงและพัฒนาคุณภาพข้อสอบ
หน้าที่ของคุณคือปรับแก้ข้อสอบเดิมตามคำสั่งที่ได้รับ โดยต้องรักษามาตรฐานคำตอบที่ถูกต้องให้สอดคล้อง
คืนค่าเฉพาะ JSON ของข้อสอบที่ปรับปรุงแล้วเท่านั้น`;

    const prompt = `
ปรับปรุงข้อสอบข้อนี้:
คำสั่งปรับปรุง: "${actionCommand || 'ทำให้คุณภาพข้อสอบดีขึ้น'}"

วิชา: ${subject || 'ทั่วไป'}
เรื่อง: ${topic || 'บทเรียน'}

ข้อสอบเดิม:
${JSON.stringify(question, null, 2)}

โปรดคืนค่าเป็น JSON รูปแบบนี้:
{
  "questionOrder": ${question.questionOrder},
  "type": "${question.type}",
  "questionText": "ข้อความโจทย์ใหม่ที่ปรับปรุงแล้ว...",
  "options": [
    {"optionKey": "A", "optionText": "...", "isCorrect": false},
    {"optionKey": "B", "optionText": "...", "isCorrect": true},
    {"optionKey": "C", "optionText": "...", "isCorrect": false},
    {"optionKey": "D", "optionText": "...", "isCorrect": false}
  ],
  "explanation": "คำอธิบายเฉลยที่ปรับตามโจทย์ใหม่...",
  "difficulty": "${question.difficulty}",
  "cognitiveLevel": "${question.cognitiveLevel}",
  "score": ${question.score || 1},
  "sourceTopic": "${question.sourceTopic || topic || ''}"
}
`;

    try {
      const improvedQuestion = await generateJSONResponse<Question>(prompt, systemInstruction);
      return NextResponse.json({ question: improvedQuestion });
    } catch (e: any) {
      console.warn('Gemini improve question fallback mode activated:', e?.message);

      // Local fallback for improving question when API key missing
      const isHarder = actionCommand.includes('ยาก');
      const isSituation = actionCommand.includes('สถานการณ์');

      const updatedQuestion: Question = {
        ...question,
        questionText: isSituation
          ? `[สถานการณ์สมมติ] ในการปฏิบัติงานจริง หากเกิดโจทย์: ${question.questionText}`
          : isHarder
          ? `[ระดับสูง/วิเคราะห์] จงวิเคราะห์และระบุว่า ${question.questionText}`
          : question.questionText,
        difficulty: isHarder ? 'hard' : question.difficulty,
        explanation: `${question.explanation || ''} (ปรับปรุงตามคำสั่ง: ${actionCommand})`,
      };

      return NextResponse.json({ question: updatedQuestion });
    }
  } catch (error: any) {
    console.error('Improve question API route error:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการปรับปรุงข้อสอบ' }, { status: 500 });
  }
}
