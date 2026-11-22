import { Student, Exam, ExamVersion, AnswerSheet, ScanRecord } from './types';
import { OMRStore } from './omrStore';

export function seedDemoData() {
  // 1. Seed Students
  const sampleStudents: Omit<Student, 'id' | 'created_at'>[] = [
    { student_id: 'ID-6701', student_code: 'STD-6701', first_name: 'สมชาย', last_name: 'ใจดี', class_name: 'ม.4/1' },
    { student_id: 'ID-6702', student_code: 'STD-6702', first_name: 'สมหญิง', last_name: 'รักเรียน', class_name: 'ม.4/1' },
    { student_id: 'ID-6703', student_code: 'STD-6703', first_name: 'กิตติ', last_name: 'ศิริผล', class_name: 'ม.4/1' },
    { student_id: 'ID-6704', student_code: 'STD-6704', first_name: 'นภา', last_name: 'สดใส', class_name: 'ม.4/1' },
    { student_id: 'ID-6705', student_code: 'STD-6705', first_name: 'ชลิต', last_name: 'ปัญญางาม', class_name: 'ม.4/1' },
    { student_id: 'ID-6706', student_code: 'STD-6706', first_name: 'อนันต์', last_name: 'เกียรติขจร', class_name: 'ม.4/2' },
    { student_id: 'ID-6707', student_code: 'STD-6707', first_name: 'ปรียา', last_name: 'วรโชติ', class_name: 'ม.4/2' },
    { student_id: 'ID-6708', student_code: 'STD-6708', first_name: 'ธนกร', last_name: 'วิเศษสรรค์', class_name: 'ม.4/2' },
    { student_id: 'ID-6709', student_code: 'STD-6709', first_name: 'วรรณิสา', last_name: 'มั่งคั่ง', class_name: 'ม.4/2' },
    { student_id: 'ID-6710', student_code: 'STD-6710', first_name: 'ศุภชัย', last_name: 'เจริญสุข', class_name: 'ม.4/2' },
  ];

  const createdStudents: Student[] = [];
  sampleStudents.forEach((s) => {
    createdStudents.push(OMRStore.saveStudent(s));
  });

  // 2. Seed Logic Exam (40 questions)
  const questionsList = Array.from({ length: 40 }).map((_, i) => ({
    id: `q-${i + 1}`,
    question_number: i + 1,
    question_text: `โจทย์คำถามการคิดวิเคราะห์ตรรกศาสตร์ ข้อที่ ${i + 1}`,
    choice_a: `ตัวเลือก ก ข้อ ${i + 1}`,
    choice_b: `ตัวเลือก ข ข้อ ${i + 1}`,
    choice_c: `ตัวเลือก ค ข้อ ${i + 1}`,
    choice_d: `ตัวเลือก ง ข้อ ${i + 1}`,
    correct_answer: (['A', 'B', 'C', 'D'][i % 4]) as 'A' | 'B' | 'C' | 'D',
  }));

  const examData: Partial<Exam> = {
    id: 'exam-logic-01',
    exam_code: 'LOGIC-01',
    title: 'แบบทดสอบตรรกศาสตร์และการคิดวิเคราะห์',
    subject: 'วิชา คณิตศาสตร์พื้นฐาน (ค31101)',
    description: 'แบบทดสอบวัดผลสัมฤทธิ์ปลายภาค 40 ข้อ (4 ตัวเลือก) แบ่งเป็น 4 ชุดข้อสอบ (A, B, C, D)',
    total_questions: 40,
    choices_count: 4,
    questions: questionsList,
  };

  const createdExam = OMRStore.saveExam(examData);

  // 3. Seed 4 Versions (A, B, C, D)
  const versions: ExamVersion[] = ['A', 'B', 'C', 'D'].map((vCode) => {
    const vQuestions = createdExam.questions.map((q, idx) => ({
      id: `vq-${vCode}-${idx + 1}`,
      version_id: `version-${createdExam.id}-${vCode}`,
      question_number_in_version: idx + 1,
      original_question_id: q.id,
      shuffled_choices_json: [
        { choice: 'A' as const, text: q.choice_a, original_choice: 'A' },
        { choice: 'B' as const, text: q.choice_b, original_choice: 'B' },
        { choice: 'C' as const, text: q.choice_c, original_choice: 'C' },
        { choice: 'D' as const, text: q.choice_d, original_choice: 'D' },
      ],
      correct_choice_in_version: q.correct_answer,
    }));

    const v: ExamVersion = {
      id: `version-${createdExam.id}-${vCode}`,
      exam_id: createdExam.id,
      version_code: vCode as any,
      created_at: new Date().toISOString(),
      questions: vQuestions,
    };

    OMRStore.saveVersion(v);
    return v;
  });

  // 4. Seed Answer Sheets & Scans for Students
  createdStudents.forEach((st, idx) => {
    const paperCode = `8F${idx + 1}2K91X`;
    const versionObj = versions[idx % versions.length];

    const sheet: AnswerSheet = {
      id: `sheet-${st.id}`,
      paper_id: paperCode,
      student_id: st.id,
      exam_id: createdExam.id,
      version_id: versionObj.id,
      qr_payload: `PAPER:${paperCode}`,
      created_at: new Date().toISOString(),
    };

    OMRStore.saveAnswerSheet(sheet);

    // Generate Scanned Record
    const totalQ = 40;
    const correctCount = 28 + (idx % 8);
    const wrongCount = totalQ - correctCount - (idx % 2 === 0 ? 1 : 0);
    const unansweredCount = idx % 2 === 0 ? 1 : 0;
    const reviewCount = idx % 3 === 0 ? 1 : 0;
    const totalScore = correctCount;
    const percentage = Number(((totalScore / totalQ) * 100).toFixed(1));

    const scanAnswers = Array.from({ length: totalQ }).map((_, qIdx) => {
      const isCorrect = qIdx < correctCount;
      const detected = isCorrect
        ? versionObj.questions[qIdx].correct_choice_in_version
        : qIdx === totalQ - 1 && unansweredCount > 0
        ? 'UNANSWERED'
        : qIdx === totalQ - 2 && reviewCount > 0
        ? 'LOW_CONFIDENCE'
        : 'B';

      return {
        id: `sa-${sheet.paper_id}-${qIdx + 1}`,
        scan_id: `scan-${sheet.paper_id}`,
        question_number: qIdx + 1,
        detected_answer: detected as any,
        final_answer: detected as any,
        confidence_score: detected === 'LOW_CONFIDENCE' ? 0.45 : 0.95,
        fill_ratios: { A: 0.05, B: 0.4, C: 0.02, D: 0.03 },
        is_correct: isCorrect,
      };
    });

    const scanRec: ScanRecord = {
      id: `scan-${sheet.paper_id}`,
      paper_id: sheet.paper_id,
      exam_id: createdExam.id,
      version_id: versionObj.id,
      student_id: st.id,
      overall_confidence: reviewCount > 0 ? 0.75 : 1.0,
      scan_status: reviewCount > 0 ? 'LOW_CONFIDENCE' : 'SUCCESS',
      total_score: totalScore,
      correct_count: correctCount,
      wrong_count: wrongCount,
      unanswered_count: unansweredCount,
      review_count: reviewCount,
      percentage,
      scanned_at: new Date().toISOString(),
      answers: scanAnswers,
    };

    OMRStore.saveScan(scanRec);
  });

  return {
    students: createdStudents,
    exam: createdExam,
    versions,
  };
}
