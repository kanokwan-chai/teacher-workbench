import { NextResponse } from 'next/server';
import { generateJSONResponse, parseGeminiError } from '@/lib/gemini';
import { Worksheet, WorksheetSection } from '@/types';

/**
 * Deterministic fallback parser that turns raw pasted questions/code into structured WorksheetSections
 */
function parseRawTextToWorksheetSections(rawText: string, defaultTotalScore = 20): WorksheetSection[] {
  const clean = rawText.replace(/\r\n/g, '\n').trim();
  if (!clean) {
    return [
      {
        title: 'ตอนที่ 1: คำถามและแบบฝึกหัด',
        instructions: 'จงแสดงวิธีทำหรือตอบคำถามต่อไปนี้ให้ถูกต้องครบถ้วน',
        questions: [
          {
            number: 1,
            question: 'จงตอบคำถามตามที่กำหนด',
            spaceType: 'lines',
            linesCount: 3,
            score: defaultTotalScore,
          },
        ],
      },
    ];
  }

  // Split by explicit section headers if any (e.g. ตอนที่ 1, ตอนที่ 2, Part 1)
  const sectionRegex = /^(?:ตอนที่\s*\d+|Part\s*\d+|ส่วนที่\s*\d+)[^\n]*/gim;
  const sectionMatches = [...clean.matchAll(sectionRegex)];

  const rawSections: { title: string; instructions: string; body: string }[] = [];

  if (sectionMatches.length > 0) {
    for (let i = 0; i < sectionMatches.length; i++) {
      const startIdx = sectionMatches[i].index!;
      const headerLine = sectionMatches[i][0].trim();
      const bodyStart = startIdx + headerLine.length;
      const bodyEnd = i + 1 < sectionMatches.length ? sectionMatches[i + 1].index! : clean.length;
      const body = clean.slice(bodyStart, bodyEnd).trim();
      rawSections.push({
        title: headerLine,
        instructions: 'จงตอบคำถามต่อไปนี้ให้ถูกต้องและครบถ้วน',
        body,
      });
    }
  } else {
    rawSections.push({
      title: 'ตอนที่ 1: แบบฝึกหัดและใบงาน',
      instructions: 'จงอ่านโจทย์และตอบคำถามต่อไปนี้ให้ถูกต้องครบถ้วน',
      body: clean,
    });
  }

  const sections: WorksheetSection[] = rawSections.map((sec) => {
    const blocks = sec.body
      .split(/\n\s*\n+/)
      .map((b) => b.trim())
      .filter(Boolean);

    // If single block with numbered lines, split by top-level question numbers unless it looks like sub-items of one code block
    const hasCodeBlock = /[=\[\]{}()]|print\(|append\(|insert\(|remove\(|pop\(/.test(sec.body);

    let questionBlocks = blocks;
    if (blocks.length === 1 && !hasCodeBlock) {
      const lines = sec.body.split('\n').map((l) => l.trim()).filter(Boolean);
      const numberedLines = lines.filter((l) => /^(?:ข้อ\s*\d+|\d+[\.\)])\s+/.test(l));
      if (numberedLines.length >= 2) {
        questionBlocks = [];
        let current = '';
        for (const line of lines) {
          if (/^(?:ข้อ\s*\d+|\d+[\.\)])\s+/.test(line)) {
            if (current) questionBlocks.push(current.trim());
            current = line;
          } else {
            current += '\n' + line;
          }
        }
        if (current) questionBlocks.push(current.trim());
      }
    }

    const perQScore = Math.max(1, Math.round(defaultTotalScore / Math.max(1, questionBlocks.length)));

    const questions = questionBlocks.map((block, idx) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      const codeLines: string[] = [];
      const subItems: { id: string; label: string; answer: string }[] = [];
      const textLines: string[] = [];

      for (const line of lines) {
        const subMatch = line.match(/^(?:(\d+)[\.\)]\s*)?(.+?)\s*=\s*(.*)$/);
        const isCodeAssign =
          /^[a-zA-Z_]\w*\s*=\s*\[/.test(line) ||
          /^print\(/.test(line) ||
          /^[a-zA-Z_]\w*\.(append|insert|remove|pop|sort|reverse)\(/.test(line);

        if (isCodeAssign && !line.startsWith('ผลลัพธ์') && !line.startsWith('คำสั่ง')) {
          codeLines.push(line);
        } else if (
          subMatch &&
          (/^\d+[\.\)]/.test(line) ||
            line.includes('ผลลัพธ์') ||
            line.includes('คำสั่ง') ||
            /\w+\[\d+\]/.test(line))
        ) {
          const cleanLabel = subMatch[2].replace(/^\d+[\.\)]\s*/, '').trim();
          const ansClean = subMatch[3].replace(/^[\._\s]+$/, '').trim();
          subItems.push({
            id: `sub-${idx}-${subItems.length + 1}`,
            label: cleanLabel,
            answer: ansClean,
          });
        } else if (/^\d+[\.\)]\s+/.test(line) && lines.length > 2 && textLines.length > 0) {
          const cleanLabel = line.replace(/^\d+[\.\)]\s+/, '').trim();
          subItems.push({
            id: `sub-${idx}-${subItems.length + 1}`,
            label: cleanLabel,
            answer: '',
          });
        } else {
          textLines.push(line.replace(/^(?:ข้อที่?\s*\d+|ข้อ\s*\d+|\d+[\.\)])\s*/, ''));
        }
      }

      const mainQuestion =
        textLines.join(' ').trim() ||
        (codeLines.length > 0
          ? 'จงพิจารณารหัสโปรแกรมที่กำหนดให้ แล้วเติมผลลัพธ์หรือคำตอบลงในช่องว่างให้ถูกต้อง'
          : `คำถามข้อที่ ${idx + 1}`);

      return {
        number: idx + 1,
        question: mainQuestion,
        codeSnippet: codeLines.length > 0 ? codeLines.join('\n') : undefined,
        subItems: subItems.length > 0 ? subItems : undefined,
        spaceType: subItems.length > 0 ? ('blank' as const) : ('lines' as const),
        linesCount: subItems.length > 0 ? 1 : 3,
        score: subItems.length > 0 ? subItems.length : perQScore,
      };
    });

    return {
      title: sec.title,
      instructions: sec.instructions,
      questions,
    };
  });

  return sections;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      profile,
      rawText,
      title,
      subject = 'วิทยาการคำนวณ / คอมพิวเตอร์',
      gradeLevel = 'มัธยมศึกษา',
      schoolName = '',
      teacherName = '',
      worksheetType = 'worksheet',
      totalScore = 20,
      timeMinutes = 50,
    } = body;

    // Mode 1: Format raw user-provided questions into a clean Worksheet
    if (rawText && typeof rawText === 'string' && rawText.trim().length > 0) {
      const systemInstruction = `คุณคือครูผู้เชี่ยวชาญด้านการจัดทำใบงานและแบบฝึกหัด (Worksheet Formatter)
หน้าที่ของคุณคือนำโจทย์ดิบที่ครูวางให้ มาจัดระเบียบโครงสร้างเป็นใบงานที่สวยงาม อ่านง่าย เป็นระเบียบ โดยห้ามตัดทอนโจทย์ของครูออก
หากโจทย์มีโค้ดโปรแกรม (เช่น Python, C, อาเรย์, ลิสต์) ให้แยกใส่ในฟิลด์ codeSnippet
หากโจทย์มีข้อย่อย (เช่น 1. ... = ..., 2. ... = ...) ให้แยกใส่ในฟิลด์ subItems พร้อมคิดเฉลย (answer) ให้ครูด้วย
สำหรับโจทย์อัตนัยทั่วไป ให้ตั้ง spaceType เป็น "lines" และกำหนด linesCount (จำนวนบรรทัดสำหรับเขียนตอบ เช่น 3 หรือ 4) พร้อมสรุปเฉลยใน answerKey
ตอบกลับเป็น JSON ตามโครงสร้างที่กำหนดเท่านั้น`;

      const prompt = `
โปรดจัดระเบียบโจทย์ต่อไปนี้ให้เป็นโครงสร้างใบงาน (Worksheet JSON):

ชื่อใบงาน: ${title || 'ใบงาน / แบบฝึกหัด'}
วิชา: ${subject}
ระดับชั้น: ${gradeLevel}
คะแนนเต็ม: ${totalScore}
เวลา: ${timeMinutes} นาที

โจทย์ที่ครูให้มา:
"""
${rawText}
"""

โครงสร้าง JSON ที่ต้องการ:
{
  "title": "${title || 'ใบงาน / แบบฝึกหัด'}",
  "subject": "${subject}",
  "gradeLevel": "${gradeLevel}",
  "schoolName": "${schoolName}",
  "teacherName": "${teacherName}",
  "worksheetType": "${worksheetType}",
  "totalScore": ${totalScore},
  "timeMinutes": ${timeMinutes},
  "sections": [
    {
      "title": "ตอนที่ 1: ...",
      "instructions": "คำชี้แจง...",
      "questions": [
        {
          "number": 1,
          "question": "โจทย์คำถามหลัก...",
          "codeSnippet": "โค้ดโปรแกรม (ถ้ามี ถ้าไม่มีไม่ต้องใส่)",
          "subItems": [
            { "id": "sub-1", "label": "ข้อย่อย เช่น ผลลัพธ์หลังจาก activity[1]", "answer": "เฉลยของข้อย่อย" }
          ],
          "spaceType": "lines",
          "linesCount": 3,
          "score": 5,
          "answerKey": "เฉลยสำหรับโจทย์ข้อนี้"
        }
      ]
    }
  ]
}
`;

      try {
        const res = await generateJSONResponse<Omit<Worksheet, 'id' | 'createdAt'>>(prompt, systemInstruction);
        const worksheet: Worksheet = {
          ...res,
          id: `ws-${Date.now()}`,
          title: res.title || title || 'ใบงาน / แบบฝึกหัด',
          subject: res.subject || subject,
          gradeLevel: res.gradeLevel || gradeLevel,
          schoolName: schoolName || res.schoolName || '',
          teacherName: teacherName || res.teacherName || '',
          totalScore: Number(res.totalScore) || totalScore,
          timeMinutes: Number(res.timeMinutes) || timeMinutes,
          createdAt: new Date().toISOString(),
        };
        return NextResponse.json(worksheet);
      } catch (e: any) {
        const parsedErr = parseGeminiError(e);
        console.warn('Gemini raw worksheet formatter fallback activated:', e?.message);
        const fallbackSections = parseRawTextToWorksheetSections(rawText, totalScore);
        const computedScore = fallbackSections.reduce(
          (sum, s) => sum + s.questions.reduce((qs, q) => qs + (q.score || 1), 0),
          0
        );
        const worksheet: Worksheet = {
          id: `ws-${Date.now()}`,
          title: title || 'ใบงาน / แบบฝึกหัด',
          subject,
          gradeLevel,
          schoolName,
          teacherName,
          worksheetType: worksheetType as any,
          totalScore: computedScore || totalScore,
          timeMinutes,
          sections: fallbackSections,
          createdAt: new Date().toISOString(),
        };
        return NextResponse.json({
          ...worksheet,
          _fallbackUsed: true,
          _quotaWarning:
            parsedErr.errorType === 'QUOTA_EXCEEDED' || parsedErr.errorType === 'RATE_LIMIT'
              ? parsedErr.message
              : undefined,
        });
      }
    }

    // Mode 2: Generate from Content Profile
    if (!profile) {
      return NextResponse.json({ error: 'กรุณาวางโจทย์ที่ต้องการจัดใบงาน หรือเลือก Content Profile' }, { status: 400 });
    }

    const systemInstruction = `คุณคือครูผู้เชี่ยวชาญด้านการออกแบบใบงานและแบบฝึกหัดการเรียนรู้สำหรับนักเรียน
หน้าที่ของคุณคือสร้างใบงานภาษาไทยที่สมบูรณ์ ตรงตามเรื่องที่เรียน มีโครงสร้างชัดเจน คืนค่าเป็น JSON เท่านั้น
ข้อกำหนดสำคัญที่สุด: โจทย์และคำถามทุกข้อต้องตรงตามเรื่องที่เรียน (${profile.topic}) และวิชา (${profile.subject}) โดยตรง ห้ามสร้างคำถามทั่วไปหรือใช้คำศัพท์ที่ไม่เกี่ยวข้องกับเรื่องนี้เด็ดขาด`;

    const prompt = `
สร้างใบงาน/แบบฝึกหัดจาก Content Profile:
วิชา: ${profile.subject}
เรื่อง: ${profile.topic}
ประเภทใบงาน: ${worksheetType}
คะแนนเต็ม: ${totalScore} คะแนน
เวลา: ${timeMinutes} นาที

รายละเอียดบทเรียน:
- หัวข้อหลัก: ${JSON.stringify(profile.mainTopics || [])}
- คำศัพท์/มโนทัศน์: ${JSON.stringify(profile.vocabulary || [])}
- จุดประสงค์: ${JSON.stringify(profile.learningObjectives || [])}

โปรดสร้างโครงสร้างใบงานในรูปแบบ JSON:
{
  "title": "ใบงานเรื่อง: ${profile.topic}",
  "subject": "${profile.subject}",
  "gradeLevel": "${profile.gradeLevel || 'ทั่วไป'}",
  "worksheetType": "${worksheetType}",
  "totalScore": ${totalScore},
  "timeMinutes": ${timeMinutes},
  "sections": [
    {
      "title": "ตอนที่ 1: ตรวจสอบความรู้และความเข้าใจ (10 คะแนน)",
      "instructions": "จงตอบคำถามเกี่ยวกับเรื่อง ${profile.topic} ให้ถูกต้องและชัดเจน",
      "questions": [
        {"number": 1, "question": "จงอธิบายความหมายและคุณลักษณะสำคัญของ ${profile.topic}", "spaceType": "lines", "linesCount": 3, "score": 5, "answerKey": "แนวคำตอบ..."},
        {"number": 2, "question": "จงระบุส่วนประกอบหรือองค์ประกอบหลักของ ${profile.topic}", "spaceType": "lines", "linesCount": 3, "score": 5, "answerKey": "แนวคำตอบ..."}
      ]
    },
    {
      "title": "ตอนที่ 2: การวิเคราะห์และการแก้ปัญหา (10 คะแนน)",
      "instructions": "จงวิเคราะห์โจทย์และแสดงวิธีแก้ปัญหาเรื่อง ${profile.topic} โดยละเอียด",
      "questions": [
        {"number": 1, "question": "จากเรื่อง ${profile.topic} จงยกตัวอย่างสถานการณ์การนำหลักการไปใช้ในชีวิตจริงหรือการเขียนโปรแกรมอย่างน้อย 2 ประการ", "spaceType": "box", "score": 10, "answerKey": "แนวคำตอบ..."}
      ]
    }
  ]
}
`;

    try {
      const res = await generateJSONResponse<Omit<Worksheet, 'id' | 'createdAt'>>(prompt, systemInstruction);
      const worksheet: Worksheet = {
        ...res,
        id: `ws-${Date.now()}`,
        contentProfileId: profile.id,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json(worksheet);
    } catch (e: any) {
      console.warn('Gemini worksheet generator fallback mode activated:', e?.message);

      const rawVocab = (profile.vocabulary || []).filter(
        (v: any) => v.word !== 'Analysis' && v.word !== 'Evaluation'
      );

      const topicVocab =
        rawVocab.length > 0
          ? rawVocab
          : [
              { word: `แนวคิดหลักของเรื่อง ${profile.topic}`, meaning: `ความหมายและหลักการของ ${profile.topic}` },
              { word: `องค์ประกอบของ ${profile.topic}`, meaning: `ส่วนประกอบสำคัญในเรื่อง ${profile.topic}` },
            ];

      const worksheet: Worksheet = {
        id: `ws-${Date.now()}`,
        contentProfileId: profile.id,
        title: `ใบงานเรื่อง: ${profile.topic || profile.subject}`,
        subject: profile.subject,
        gradeLevel: profile.gradeLevel || 'ทั่วไป',
        worksheetType: worksheetType as any,
        totalScore,
        timeMinutes,
        sections: [
          {
            title: 'ตอนที่ 1: ตรวจสอบความเข้าใจคำศัพท์และแนวคิดหลัก (10 คะแนน)',
            instructions: `จงอธิบายความหมายของคำศัพท์และแนวคิดเรื่อง ${profile.topic} ตามบทเรียน`,
            questions: topicVocab.slice(0, 3).map((v: any, i: number) => ({
              number: i + 1,
              question: `จงอธิบายความหมายและหลักการสำคัญของ "${v.word}" ในเรื่อง ${profile.topic}`,
              spaceType: 'lines',
              linesCount: 3,
              score: 5,
              answerKey: v.meaning || '',
            })),
          },
          {
            title: 'ตอนที่ 2: การวิเคราะห์และการประยุกต์ใช้ (10 คะแนน)',
            instructions: `จงแสดงความคิดเห็น หรือขั้นตอนการแก้ปัญหาเรื่อง ${profile.topic} โดยละเอียด`,
            questions: [
              {
                number: 1,
                question: `จากเรื่อง ${profile.topic} จงยกตัวอย่างการนำหลักการไปใช้ในชีวิตจริงหรือการแก้ปัญหาอย่างน้อย 2 ประการ`,
                spaceType: 'box',
                score: 10,
              },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json(worksheet);
    }
  } catch (error: any) {
    console.error('Worksheet API route error:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการสร้างใบงาน' }, { status: 500 });
  }
}
