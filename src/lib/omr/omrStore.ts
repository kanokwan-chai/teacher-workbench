import {
  Student,
  Exam,
  ExamVersion,
  AnswerSheet,
  ScanRecord,
  ItemAnalysisData,
} from './types';
import { supabase } from '@/lib/supabase/client';

const STORAGE_KEYS = {
  STUDENTS: 'omr_students_v1',
  EXAMS: 'omr_exams_v1',
  VERSIONS: 'omr_versions_v1',
  SHEETS: 'omr_sheets_v1',
  SCANS: 'omr_scans_v1',
};

// Helper for local storage read/write
function getLocal<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

const SAMPLE_EXAM: Exam = {
  id: 'exam-sample-1',
  exam_code: 'EXAM-SCI-101',
  title: 'แบบทดสอบวัดผลสัมฤทธิ์ทางการเรียน (วิชาวิทยาศาสตร์)',
  subject: 'วิทยาศาสตร์พื้นฐาน (ว21101)',
  description: 'แบบทดสอบ 10 ข้อ 4 ตัวเลือก พร้อมเฉลยแยกชุด A, B, C, D',
  total_questions: 10,
  choices_count: 4,
  created_at: new Date().toISOString(),
  questions: Array.from({ length: 10 }).map((_, i) => ({
    id: `q-${i + 1}`,
    question_number: i + 1,
    question_text: `ข้อที่ ${i + 1} โจทย์คำถามทดสอบวัดความรู้`,
    choice_a: 'ตัวเลือก ก',
    choice_b: 'ตัวเลือก ข',
    choice_c: 'ตัวเลือก ค',
    choice_d: 'ตัวเลือก ง',
    correct_answer: (['A', 'B', 'C', 'D'][i % 4]) as any,
  })),
};

const SAMPLE_VERSIONS: ExamVersion[] = (['A', 'B', 'C', 'D'] as const).map((vCode) => ({
  id: `version-sample-${vCode}`,
  exam_id: 'exam-sample-1',
  version_code: vCode,
  created_at: new Date().toISOString(),
  questions: Array.from({ length: 10 }).map((_, i) => {
    const keys = vCode === 'A' ? ['A', 'B', 'C', 'D'] :
                 vCode === 'B' ? ['B', 'C', 'D', 'A'] :
                 vCode === 'C' ? ['C', 'D', 'A', 'B'] : ['D', 'A', 'B', 'C'];
    const correctInVer = keys[i % 4] as any;
    return {
      id: `vq-${vCode}-${i + 1}`,
      version_id: `version-sample-${vCode}`,
      question_number_in_version: i + 1,
      original_question_id: `q-${i + 1}`,
      original_question_number: i + 1,
      correct_choice_in_version: correctInVer,
    };
  }),
}));

export class OMRStore {
  // Check Supabase connection status
  static isSupabaseConnected(): boolean {
    return !!supabase;
  }

  // Clear ALL Local & Demo Data Completely
  static clearAllData(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEYS.STUDENTS);
      localStorage.removeItem(STORAGE_KEYS.EXAMS);
      localStorage.removeItem(STORAGE_KEYS.VERSIONS);
      localStorage.removeItem(STORAGE_KEYS.SHEETS);
      localStorage.removeItem(STORAGE_KEYS.SCANS);
      localStorage.clear();
    } catch (e) {
      console.error('Clear data error:', e);
    }
  }

  // Students API
  static getStudents(): Student[] {
    return getLocal<Student[]>(STORAGE_KEYS.STUDENTS, []);
  }

  static async fetchStudentsAsync(): Promise<Student[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          setLocal(STORAGE_KEYS.STUDENTS, data);
          return data as Student[];
        }
      } catch (e) {
        console.warn('Supabase fetch students error:', e);
      }
    }
    return this.getStudents();
  }

  static saveStudent(student: { id?: string; student_id?: string; student_code: string; first_name: string; last_name: string; class_name: string }): Student {
    const students = this.getStudents();
    const now = new Date().toISOString();

    if (student.id) {
      const idx = students.findIndex((s) => s.id === student.id);
      if (idx !== -1) {
        students[idx] = { ...students[idx], ...student };
        setLocal(STORAGE_KEYS.STUDENTS, students);
        if (supabase) {
          supabase.from('students').update(students[idx]).eq('id', student.id).then();
        }
        return students[idx];
      }
    }

    const newStudent: Student = {
      id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      student_id: student.student_id || `ID-${Date.now()}`,
      student_code: student.student_code,
      first_name: student.first_name,
      last_name: student.last_name,
      class_name: student.class_name,
      created_at: now,
    };

    students.push(newStudent);
    setLocal(STORAGE_KEYS.STUDENTS, students);

    if (supabase) {
      supabase.from('students').insert([newStudent]).then();
    }

    return newStudent;
  }

  static deleteStudent(id: string): void {
    const students = this.getStudents().filter((s) => s.id !== id);
    setLocal(STORAGE_KEYS.STUDENTS, students);
    if (supabase) {
      supabase.from('students').delete().eq('id', id).then();
    }
  }

  // Exams API
  static getExams(): Exam[] {
    const exams = getLocal<Exam[]>(STORAGE_KEYS.EXAMS, []);
    if (exams.length === 0) {
      setLocal(STORAGE_KEYS.EXAMS, [SAMPLE_EXAM]);
      setLocal(STORAGE_KEYS.VERSIONS, SAMPLE_VERSIONS);
      return [SAMPLE_EXAM];
    }
    return exams;
  }

  static async fetchExamsAsync(): Promise<Exam[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          setLocal(STORAGE_KEYS.EXAMS, data);
          return data as Exam[];
        }
      } catch (e) {
        console.warn('Supabase fetch exams error:', e);
      }
    }
    return this.getExams();
  }

  static getExamById(id: string): Exam | null {
    return this.getExams().find((e) => e.id === id) || null;
  }

  static saveExam(exam: Partial<Exam>): Exam {
    const exams = this.getExams();
    const now = new Date().toISOString();

    if (exam.id) {
      const idx = exams.findIndex((e) => e.id === exam.id);
      if (idx !== -1) {
        exams[idx] = { ...exams[idx], ...exam } as Exam;
        setLocal(STORAGE_KEYS.EXAMS, exams);
        if (supabase) {
          supabase.from('exams').update(exams[idx]).eq('id', exam.id).then();
        }
        return exams[idx];
      }
    }

    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      exam_code: exam.exam_code || `EX-${Date.now()}`,
      title: exam.title || 'แบบทดสอบใหม่',
      subject: exam.subject || 'วิชาทั่วไป',
      description: exam.description || '',
      total_questions: exam.total_questions || 40,
      choices_count: exam.choices_count || 4,
      created_at: now,
      questions: exam.questions || [],
    };

    exams.push(newExam);
    setLocal(STORAGE_KEYS.EXAMS, exams);

    if (supabase) {
      supabase.from('exams').insert([newExam]).then();
    }

    return newExam;
  }

  static deleteExam(id: string): void {
    const exams = this.getExams().filter((e) => e.id !== id);
    setLocal(STORAGE_KEYS.EXAMS, exams);
    if (supabase) {
      supabase.from('exams').delete().eq('id', id).then();
    }
  }

  // Versions API
  static getVersions(): ExamVersion[] {
    return getLocal<ExamVersion[]>(STORAGE_KEYS.VERSIONS, []);
  }

  static getVersionsByExamId(examId: string): ExamVersion[] {
    return this.getVersions().filter((v) => v.exam_id === examId);
  }

  static getVersionById(id: string): ExamVersion | null {
    return this.getVersions().find((v) => v.id === id) || null;
  }

  static saveVersion(version: ExamVersion): void {
    const versions = this.getVersions();
    const idx = versions.findIndex((v) => v.id === version.id);
    if (idx !== -1) {
      versions[idx] = version;
    } else {
      versions.push(version);
    }
    setLocal(STORAGE_KEYS.VERSIONS, versions);
    if (supabase) {
      supabase.from('exam_versions').upsert([version]).then();
    }
  }

  // Answer Sheets API
  static getAnswerSheets(): AnswerSheet[] {
    return getLocal<AnswerSheet[]>(STORAGE_KEYS.SHEETS, []);
  }

  static getAnswerSheetByPaperId(paperId: string): AnswerSheet | null {
    const cleaned = paperId.replace('PAPER:', '').trim();
    return this.getAnswerSheets().find((s) => s.paper_id === cleaned || s.paper_id === paperId) || null;
  }

  static saveAnswerSheet(sheet: AnswerSheet): void {
    const sheets = this.getAnswerSheets();
    const idx = sheets.findIndex((s) => s.id === sheet.id);
    if (idx !== -1) {
      sheets[idx] = sheet;
    } else {
      sheets.push(sheet);
    }
    setLocal(STORAGE_KEYS.SHEETS, sheets);
    if (supabase) {
      supabase.from('answer_sheets').upsert([sheet]).then();
    }
  }

  // Scans & Results API
  static getScans(): ScanRecord[] {
    return getLocal<ScanRecord[]>(STORAGE_KEYS.SCANS, []);
  }

  static async fetchScansAsync(): Promise<ScanRecord[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('scans').select('*').order('scanned_at', { ascending: false });
        if (!error && data) {
          setLocal(STORAGE_KEYS.SCANS, data);
          return data as ScanRecord[];
        }
      } catch (e) {
        console.warn('Supabase fetch scans error:', e);
      }
    }
    return this.getScans();
  }

  static saveScan(scan: ScanRecord): void {
    const scans = this.getScans();
    const idx = scans.findIndex((s) => s.id === scan.id);
    if (idx !== -1) {
      scans[idx] = scan;
    } else {
      scans.push(scan);
    }
    setLocal(STORAGE_KEYS.SCANS, scans);
    if (supabase) {
      supabase.from('scans').upsert([scan]).then();
    }
  }

  // Item Analysis Aggregator
  static getItemAnalysis(examId: string): ItemAnalysisData[] {
    const exam = this.getExamById(examId);
    if (!exam) return [];

    const scans = this.getScans().filter((s) => s.exam_id === examId);
    const analysisMap: Record<number, ItemAnalysisData> = {};

    exam.questions.forEach((q) => {
      analysisMap[q.question_number] = {
        question_number: q.question_number,
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        choice_counts: { A: 0, B: 0, C: 0, D: 0, E: 0, UNANSWERED: 0, MULTIPLE: 0 },
        total_responses: scans.length,
        correct_count: 0,
        wrong_count: 0,
        correct_percentage: 0,
      };
    });

    scans.forEach((scan) => {
      scan.answers.forEach((ans) => {
        const item = analysisMap[ans.question_number];
        if (item) {
          const finalAns = ans.final_answer;
          if (['A', 'B', 'C', 'D', 'E'].includes(finalAns)) {
            item.choice_counts[finalAns as 'A' | 'B' | 'C' | 'D' | 'E']++;
          } else if (finalAns === 'UNANSWERED') {
            item.choice_counts.UNANSWERED++;
          } else {
            item.choice_counts.MULTIPLE++;
          }

          if (ans.is_correct) {
            item.correct_count++;
          } else {
            item.wrong_count++;
          }
        }
      });
    });

    Object.values(analysisMap).forEach((item) => {
      item.correct_percentage =
        item.total_responses > 0
          ? Number(((item.correct_count / item.total_responses) * 100).toFixed(1))
          : 0;
    });

    return Object.values(analysisMap);
  }
}
