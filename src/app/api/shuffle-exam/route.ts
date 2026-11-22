import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'กรุณาระบุเนื้อหาข้อสอบ' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    let parsedQuestions: any[] = [];

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              text: `คุณคือผู้เชี่ยวชาญการจัดโครงสร้างข้อสอบ วิชาคณิตศาสตร์ วิทยาศาสตร์ และคอมพิวเตอร์/การเขียนโปรแกรม
จงแปลงข้อความข้อสอบต่อไปนี้ให้อยู่ในรูปแบบ JSON Array เท่านั้น 

กฎการแปลงสัญลักษณ์ทางคณิตศาสตร์ การจัดรูปแบบโค้ดโปรแกรม และประเภทข้อสอบที่สำคัญมาก:
1. หากพบสัญลักษณ์สี่เหลี่ยม หรืออักขระเพี้ยน เช่น ☐ 104 หรือ 10 4 ให้แปลงเป็นเลขยกกำลังและเครื่องหมายคณิตศาสตร์ที่ถูกต้อง เช่น "× 10⁴" หรือ "× 10³" หรือ "× 10²" หรือ "× 10¹" หรือ "× 10⁰"
2. หากเป็นเลขยกกำลังให้ใช้ Unicode ยกกำลัง เช่น ⁰ ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ⁿ และหากเป็นตัวห้อยให้ใช้ Unicode ตัวห้อย เช่น ₀ ₁ ₂ ₃ ₄ ₅ ₆ ₇ ₈ ₉
3. หากพบโจทย์ที่มีโค้ดโปรแกรม (เช่น Python, C, Java, อาร์เรย์ 1 มิติ/2 มิติ) หรือการเติมผลลัพธ์จากการทำงานของโปรแกรมหลายข้อย่อย (เช่น 1. temperature[0] = ....., 2. temperature[3] = .....):
   - ให้ตั้งค่า "type": "coding_output"
   - หากโค้ดติดกันในบรรทัดเดียว เช่น "temperature = [28, 31, 29, 33, 35, 30]print(temperature[0])print(temperature[3])" ให้จัดระเบียบขึ้นบรรทัดใหม่ (newline \\n) และย่อหน้า (indentation) ให้สวยงามอ่านง่ายในฟิลด์ "codeSnippet"
   - แยกข้อย่อยที่ให้เติมผลลัพธ์ใส่ในอาร์เรย์ "subItems": [{"label": "temperature[0]", "answer": "28"}, {"label": "temperature[3]", "answer": "33"}, ...] พร้อมคำนวณหาคำตอบที่ถูกต้องใส่ใน "answer" ให้ครบถ้วน!
   - หากในข้อความมีโค้ดหลายส่วน (เช่น อาร์เรย์ 1 มิติ และ อาร์เรย์ 2 มิติ) สามารถรวมโค้ดทั้งหมดไว้ใน "codeSnippet" (คั่นด้วยบรรทัดว่างและคอมเมนต์) หรือแยกเป็นข้อสอบคนละข้อใน JSON Array ตามความเหมาะสมได้เลย
4. หากเป็นข้อสอบเติมคำตอบทั่วไป (ไม่มีตัวเลือก ก-ง แต่มีช่องว่างให้เติมคำเดียว) ให้ตั้งค่า "type": "fill_blank" และใส่เฉลยใน "correctAnswerText"
5. หากเป็นข้อสอบปรนัย (มีตัวเลือก ก, ข, ค, ง) ให้ตั้งค่า "type": "multiple_choice" และตัดหัวข้อตัวเลือก เช่น (ก):, ก., (ก) ออกจากข้อความใน 'options' ให้เหลือเพียงเนื้อหาตัวเลือกเท่านั้น

โครงสร้างของแต่ละวัตถุใน JSON Array:
- "id": ข้อความรหัสสุ่ม เช่น "q-1", "q-2"
- "type": "multiple_choice" | "coding_output" | "fill_blank" | "essay" | "matching"
- "text": โจทย์คำถามหรือคำสั่งหลัก (string)
- "codeSnippet": โค้ดโปรแกรมที่จัดบรรทัดสวยงามแล้ว (เฉพาะกรณีมีโค้ดโปรแกรม ถ้าไม่มีให้เว้นว่าง "")
- "subItems": อาร์เรย์ของข้อย่อย [{"label": "สิ่งที่ถาม เช่น temperature[0]", "answer": "คำตอบที่คำนวณได้ เช่น 28"}] (เฉพาะกรณีมีข้อย่อยเติมผลลัพธ์)
- "options": ตัวเลือกคำตอบเป็นอาร์เรย์ของ string (สำหรับ multiple_choice)
- "answerIndex": ดัชนีตัวเลือกที่ถูก 0 ถึง N-1 (สำหรับ multiple_choice)
- "correctAnswerText": เฉลยคำตอบ (สำหรับ fill_blank หรือสรุปคำตอบของ coding_output)

ข้อความข้อสอบที่จะให้แปลง:
${text}

คำตอบของคุณต้องเป็น JSON Array เท่านั้น ห้ามใส่คำเกริ่นหรือข้อความอื่น`,
            },
          ],
        });

        const rawRes = response.text || '';
        const cleanedJson = rawRes.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedQuestions = JSON.parse(cleanedJson);
      } catch (e: any) {
        console.warn('Gemini Parse Exam fallback:', e?.message);
        parsedQuestions = fallbackRegexParse(text);
      }
    } else {
      parsedQuestions = fallbackRegexParse(text);
    }

    return NextResponse.json({ questions: parsedQuestions });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'เกิดข้อผิดพลาดในการประมวลผลข้อสอบ' }, { status: 500 });
  }
}

function formatCodeSnippet(rawCode: string): string {
  return rawCode
    .replace(/\]\s*print\(/g, ']\nprint(')
    .replace(/\)\s*print\(/g, ')\nprint(')
    .replace(/\[\s*\[/g, '[\n    [')
    .replace(/\],\s*\[/g, '],\n    [')
    .replace(/\]\s*\]/g, ']\n]')
    .trim();
}

function evaluatePythonArrayAccess(code: string, expr: string): string {
  try {
    // Match 2D array access e.g. data[2][1]
    const match2D = expr.match(/([a-zA-Z_]\w*)\[(\d+)\]\[(\d+)\]/);
    if (match2D) {
      const varName = match2D[1];
      const r = parseInt(match2D[2], 10);
      const c = parseInt(match2D[3], 10);
      const regex = new RegExp(`${varName}\\s*=\\s*(\\[\\s*\\[[^;]+?\\]\\s*\\])`);
      const m = code.match(regex);
      if (m) {
        const arr = JSON.parse(m[1]);
        if (arr[r] && arr[r][c] !== undefined) return String(arr[r][c]);
      }
    }
    // Match 1D array access e.g. temperature[0]
    const match1D = expr.match(/([a-zA-Z_]\w*)\[(\d+)\]/);
    if (match1D) {
      const varName = match1D[1];
      const idx = parseInt(match1D[2], 10);
      const regex = new RegExp(`${varName}\\s*=\\s*(\\[[^\\[\\]]+?\\])`);
      const m = code.match(regex);
      if (m) {
        const arr = JSON.parse(m[1]);
        if (arr[idx] !== undefined) return String(arr[idx]);
      }
    }
  } catch {
    // ignore eval error
  }
  return '';
}

function fallbackRegexParse(text: string) {
  let cleanedText = text.replace(/☐/g, '×');

  // Check if text contains coding output / array access fill-in pattern
  const hasCodePattern =
    /print\s*\(/.test(cleanedText) ||
    /\w+\s*=\s*\[/.test(cleanedText) ||
    /\d+\.\s*\w+\[\d+\]\s*=\s*\.{2,}/.test(cleanedText);

  if (hasCodePattern) {
    const lines = cleanedText.split('\n').map((l) => l.trim()).filter(Boolean);
    let titleText = 'จงเติมผลลัพธ์ที่ได้จากการทำงานของโปรแกรม';
    const codeBlocks: string[] = [];
    const subItems: { label: string; answer: string }[] = [];

    for (const line of lines) {
      // Check if it's a sub-item fill-in line like "1. temperature[0] = ...................."
      const subMatch = line.match(/^(?:\d+[\.\)]\s*)?(.+?)\s*=\s*[\.\_]{2,}(.*)$/);
      if (subMatch) {
        const label = subMatch[1].trim();
        const fullCode = codeBlocks.join('\n');
        const ans = evaluatePythonArrayAccess(fullCode, label);
        subItems.push({ label, answer: ans });
        continue;
      }

      // Check if it's a code line (assignment or print)
      if (/^[a-zA-Z_]\w*\s*=\s*\[/.test(line) || /print\s*\(/.test(line)) {
        codeBlocks.push(formatCodeSnippet(line));
        continue;
      }

      // Check if it's the main title / instruction line
      if (!line.startsWith('กำหนด') && !line.startsWith('จงเติม') && titleText === 'จงเติมผลลัพธ์ที่ได้จากการทำงานของโปรแกรม') {
        titleText = line;
      }
    }

    if (subItems.length > 0 || codeBlocks.length > 0) {
      return [
        {
          id: `q-code-${Date.now()}`,
          type: 'coding_output',
          text: titleText,
          codeSnippet: codeBlocks.join('\n\n'),
          subItems,
          options: ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
          answerIndex: 0,
          correctAnswerText: subItems.map((s, i) => `${i + 1}) ${s.label} = ${s.answer}`).join(', '),
        },
      ];
    }
  }

  const lines = cleanedText.split('\n').map((l) => l.trim()).filter(Boolean);
  const questions: any[] = [];
  let currentQ: any = null;

  lines.forEach((line) => {
    if (/^\d+[\.\)]/.test(line)) {
      if (currentQ && currentQ.options.length > 0) {
        questions.push(currentQ);
      }
      currentQ = {
        id: `q-${Date.now()}-${Math.random()}`,
        text: line.replace(/^\d+[\.\)]\s*/, ''),
        options: [],
        answerIndex: 0,
      };
    } else if (/^[\(\[]?\s*([ก-งa-eA-E1-5])\s*[\:\.\)\]]*/.test(line) && currentQ) {
      const cleanOpt = line.replace(/^[\(\[]?\s*([ก-งa-eA-E1-5])\s*[\:\.\)\]]+\s*/, '').trim();
      currentQ.options.push(cleanOpt);
    }
  });

  if (currentQ && currentQ.options.length > 0) {
    questions.push(currentQ);
  }

  return questions;
}
