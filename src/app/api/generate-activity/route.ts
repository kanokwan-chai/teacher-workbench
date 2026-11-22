import { NextResponse } from 'next/server';
import { generateJSONResponse } from '@/lib/gemini';
import { Activity, ContentProfile } from '@/types';

export async function POST(req: Request) {
  try {
    const { profile, groupType = 'group', duration = '60 นาที' } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: 'ไม่พบ Content Profile' }, { status: 400 });
    }

    const systemInstruction = `คุณคือครูผู้เชี่ยวชาญด้านการออกแบบกิจกรรมการเรียนรู้แบบ Active Learning
หน้าที่ของคุณคือออกแบบกิจกรรมการเรียนรู้ภาษาไทยที่สนุก สร้างสรรค์ และประเมินผลได้ คืนค่าเป็น JSON เท่านั้น`;

    const prompt = `
ออกแบบกิจกรรมการเรียนรู้จาก Content Profile:
วิชา: ${profile.subject}
เรื่อง: ${profile.topic}
รูปแบบ: ${groupType} (เดี่ยว/คู่/กลุ่ม)
ระยะเวลา: ${duration}

โปรดสร้างโครงสร้างกิจกรรมในรูปแบบ JSON:
{
  "title": "ชื่อกิจกรรมการเรียนรู้...",
  "duration": "${duration}",
  "groupType": "${groupType}",
  "gradeLevel": "${profile.gradeLevel || 'ทั่วไป'}",
  "objectives": ["จุดประสงค์ 1", "จุดประสงค์ 2"],
  "materials": ["อุปกรณ์ 1", "อุปกรณ์ 2"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "ขั้นนำเข้าสู่บทเรียน",
      "durationMinutes": 10,
      "description": "รายละเอียด...",
      "teacherRole": "บทบาทครู...",
      "studentRole": "บทบาทนักเรียน..."
    }
  ],
  "studentInstructions": "คำสั่งสำหรับผู้เรียน...",
  "assessmentMethod": "วิธีประเมินผล...",
  "rubric": [
    {
      "criteria": "ความถูกต้องของเนื้อหา",
      "excellent": "ถูกต้องครบถ้วน",
      "good": "ถูกต้องส่วนใหญ่",
      "fair": "มีข้อผิดพลาดบางส่วน"
    }
  ]
}
`;

    try {
      const res = await generateJSONResponse<Omit<Activity, 'id' | 'createdAt'>>(prompt, systemInstruction);
      const activity: Activity = {
        ...res,
        id: `act-${Date.now()}`,
        contentProfileId: profile.id,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json(activity);
    } catch (e: any) {
      console.warn('Gemini activity generator fallback mode activated:', e?.message);

      const activity: Activity = {
        id: `act-${Date.now()}`,
        contentProfileId: profile.id,
        title: `กิจกรรมActive Learning: ${profile.topic || profile.subject}`,
        duration,
        groupType: groupType as any,
        gradeLevel: profile.gradeLevel || 'ทั่วไป',
        objectives: profile.learningObjectives || ['ส่งเสริมความเข้าใจในบทเรียน', 'ฝึกทักษะการทำงานร่วมกัน'],
        materials: ['กระดาษปรู๊ฟ / กระดาษ A4', 'ปากกาเคมีสีต่างๆ', 'ใบความรู้บทเรียน'],
        steps: [
          {
            stepNumber: 1,
            title: 'ขั้นกระตุ้นความสนใจ (Warm-up)',
            durationMinutes: 10,
            description: 'ครูตั้งคำถามชวนคิดเพื่อเชื่อมโยงประสบการณ์เดิมของนักเรียนเข้าสู่เรื่องที่เรียน',
            teacherRole: 'ตั้งคำถามและอำนวยความสะดวกในการแสดงความคิดเห็น',
            studentRole: 'ร่วมกันตอบคำถามและแลกเปลี่ยนมุมมอง',
          },
          {
            stepNumber: 2,
            title: 'ขั้นสำรวจและค้นหา (Group Exploration)',
            durationMinutes: 30,
            description: 'แบ่งกลุ่มนักเรียนวิเคราะห์โจทย์สถานการณ์และสรุปแผนภาพความคิด (Mind Map)',
            teacherRole: 'เดินให้คำแนะนำและกระตุ้นการคิดอย่างใกล้ชิด',
            studentRole: 'ระดมความคิดเห็น อภิปราย และสรุปข้อมูลลงกระดาษ',
          },
          {
            stepNumber: 3,
            title: 'ขั้นสะท้อนความคิดและอภิปราย (Presentation & Reflection)',
            durationMinutes: 20,
            description: 'ตัวแทนกลุ่มออกมานำเสนอผลงาน และร่วมกันสรุปประเด็นสำคัญประจำบทเรียน',
            teacherRole: 'ให้ข้อเสนอแนะ สรุปประเด็นสำคัญ และประเมินผล',
            studentRole: 'นำเสนอผลงาน รับฟังเพื่อน และสอบถามข้อสงสัย',
          },
        ],
        studentInstructions: 'ให้นักเรียนแบ่งกลุ่มๆ ละ 4-5 คน ร่วมกันศึกษาใบความรู้ แล้วสรุปประเด็นสำคัญพร้อมนำเสนอหน้าชั้นเรียน',
        assessmentMethod: 'ประเมินจากผลงานกลุ่ม การมีส่วนร่วมในการอภิปราย และการนำเสนอผลงาน',
        rubric: [
          { criteria: 'ความถูกต้องของเนื้อหา', excellent: 'เนื้อหาถูกต้องสมบูรณ์ตรงตามวัตถุประสงค์', good: 'เนื้อหาถูกต้องส่วนใหญ่', fair: 'เนื้อหามีข้อผิดพลาดบางส่วน' },
          { criteria: 'ความร่วมมือในกลุ่ม', excellent: 'ทุกคนมีส่วนร่วมและช่วยเหลือกันเป็นอย่างดี', good: 'สมาชิกส่วนใหญ่มีส่วนร่วม', fair: 'มีเพียงบางคนทำงาน' },
        ],
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json(activity);
    }
  } catch (error: any) {
    console.error('Activity API route error:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการสร้างกิจกรรม' }, { status: 500 });
  }
}
