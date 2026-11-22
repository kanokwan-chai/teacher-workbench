import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { studentList = [], tasks = [], days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'] } = await req.json();

    if (!studentList || studentList.length === 0) {
      return NextResponse.json({ error: 'กรุณากรอกรายชื่อนักเรียนอย่างน้อย 1 คน' }, { status: 400 });
    }

    const activeTasks = tasks.length > 0 ? tasks : ['เวรกวาดห้อง', 'เวรทิ้งขยะ', 'เวรเช็ดกระดาน', 'เวรจัดโต๊ะ'];

    // Rotate students evenly across days & tasks
    const roster: Record<string, Record<string, string[]>> = {};

    let studentIdx = 0;
    days.forEach((day: string) => {
      roster[day] = {};
      activeTasks.forEach((task: string) => {
        roster[day][task] = [];
        // Assign 2 students per task per day if available
        const countToAssign = Math.max(1, Math.floor(studentList.length / (days.length * activeTasks.length)) || 1);
        for (let i = 0; i < countToAssign; i++) {
          if (studentList.length > 0) {
            roster[day][task].push(studentList[studentIdx % studentList.length]);
            studentIdx++;
          }
        }
      });
    });

    return NextResponse.json({
      title: 'ตารางทำเวรประจำวันห้องเรียน',
      days,
      tasks: activeTasks,
      roster,
    });
  } catch (error: any) {
    console.error('Duty roster error:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการจัดคิวทำเวร' }, { status: 500 });
  }
}
