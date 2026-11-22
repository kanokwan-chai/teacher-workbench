import { NextResponse } from 'next/server';
import { generateJSONResponse } from '@/lib/gemini';
import { LessonSummary, ContentProfile } from '@/types';

export async function POST(req: Request) {
  try {
    const { profile, docType = 'summary' } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: 'ไม่พบ Content Profile' }, { status: 400 });
    }

    const systemInstruction = `คุณคือครูผู้เชี่ยวชาญด้านการเขียนสรุปเนื้อหาและใบความรู้ระดับมืออาชีพ
หน้าที่ของคุณคือสรุปบทเรียนให้อ่านง่าย สวยงาม กระชับ มีโครงสร้าง Markdown คืนค่าเป็น JSON เท่านั้น`;

    const prompt = `
สร้างใบความรู้/สรุปบทเรียนจาก Content Profile:
วิชา: ${profile.subject}
เรื่อง: ${profile.topic}
ประเภทเอกสาร: ${docType}

โปรดสร้างโครงสร้างในรูปแบบ JSON:
{
  "title": "สรุปบทเรียนเรื่อง...",
  "subject": "${profile.subject}",
  "gradeLevel": "${profile.gradeLevel || 'ทั่วไป'}",
  "docType": "${docType}",
  "contentMarkdown": "# บทเรียนเรื่อง...\\n\\n## 1. บทนำ\\n...\\n\\n## 2. ประเด็นสำคัญ\\n...",
  "keyTakeaways": ["ประเด็นสำคัญ 1", "ประเด็นสำคัญ 2"],
  "vocabulary": [
    {"word": "คำศัพท์ 1", "meaning": "ความหมาย..."}
  ],
  "reviewQuestions": ["คำถามทบทวนท้ายบท 1", "คำถามทบทวนท้ายบท 2"]
}
`;

    try {
      const res = await generateJSONResponse<Omit<LessonSummary, 'id' | 'createdAt'>>(prompt, systemInstruction);
      const summary: LessonSummary = {
        ...res,
        id: `sum-${Date.now()}`,
        contentProfileId: profile.id,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json(summary);
    } catch (e: any) {
      console.warn('Gemini summary generator fallback mode activated:', e?.message);

      const markdownContent = `
# เอกสารสรุปบทเรียน: ${profile.topic || profile.subject}

## 📌 1. บทนำและแนวคิดหลัก (Introduction & Key Concepts)
บทเรียนเรื่อง **${profile.topic || profile.subject}** มีวัตถุประสงค์เพื่อส่งเสริมความรู้ความเข้าใจในองค์ประกอบสำคัญ ได้แก่:
${(profile.mainTopics || ['หลักการพื้นฐาน']).map((t: string) => `- **${t}**: การทำความเข้าใจหลักการและการประยุกต์ใช้งาน`).join('\n')}

---

## 💡 2. สรุปสาระสำคัญ (Key Takeaways)
${(profile.keyConcepts || ['หลักการและทฤษฎีสำคัญ']).map((c: string, idx: number) => `${idx + 1}. **${c}**: นำไปใช้เป็นกรอบความคิดในการแก้ปัญหาอย่างเป็นระบบ`).join('\n')}

---

## 📚 3. คำศัพท์น่ารู้ (Vocabulary)
${(profile.vocabulary || [{ word: 'Principle', meaning: 'หลักการ' }]).map((v: any) => `- **${v.word}**: ${v.meaning}`).join('\n')}

---

## ❓ 4. คำถามทบทวนความเข้าใจท้ายบท
1. จากเนื้อหาบทเรียน จงสรุปหัวข้อสำคัญที่เป็นหัวใจหลักของเรื่องนี้
2. สามารถนำความรู้ที่ได้ไปประยุกต์ใช้ในการเรียนหรือการทำงานได้อย่างไรบ้าง?
`;

      const summary: LessonSummary = {
        id: `sum-${Date.now()}`,
        contentProfileId: profile.id,
        title: `ใบความรู้สรุปเรื่อง: ${profile.topic || profile.subject}`,
        subject: profile.subject,
        gradeLevel: profile.gradeLevel || 'ทั่วไป',
        docType: docType as any,
        contentMarkdown: markdownContent.trim(),
        keyTakeaways: profile.keyConcepts || ['เข้าใจหลักการพื้นฐาน', 'สามารถประยุกต์ใช้งานได้'],
        vocabulary: profile.vocabulary || [],
        reviewQuestions: ['จงสรุปสาระสำคัญของบทเรียน', 'จงยกตัวอย่างการประยุกต์ใช้งาน'],
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json(summary);
    }
  } catch (error: any) {
    console.error('Summary API route error:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการสร้างสรุปบทเรียน' }, { status: 500 });
  }
}
