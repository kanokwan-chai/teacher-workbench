export type UserRole = 'admin' | 'teacher';

export interface Student {
  id: string;
  student_id: string; // Database ID / Internal
  student_code: string; // Unique student code e.g. "STD-6701"
  first_name: string;
  last_name: string;
  class_name: string;
  created_at: string;
}

export interface QuestionItem {
  id: string;
  question_number: number;
  question_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  choice_e?: string;
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface Exam {
  id: string;
  exam_code: string; // Unique exam code e.g. "LOGIC-01"
  title: string;
  subject: string;
  description: string;
  total_questions: number;
  choices_count: 4 | 5;
  created_at: string;
  questions: QuestionItem[];
}

export interface VersionQuestion {
  id: string;
  version_id: string;
  question_number_in_version: number;
  original_question_id: string;
  shuffled_choices_json?: { choice: 'A' | 'B' | 'C' | 'D' | 'E'; text: string; original_choice: string }[];
  correct_choice_in_version: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface ExamVersion {
  id: string;
  exam_id: string;
  version_code: 'A' | 'B' | 'C' | 'D' | 'E';
  created_at: string;
  questions: VersionQuestion[];
}

export interface AnswerSheet {
  id: string;
  paper_id: string; // Short code e.g. "PAPER:8F72K91X"
  student_id: string;
  exam_id: string;
  version_id: string;
  qr_payload: string;
  created_at: string;
}

export type DetectedAnswerStatus =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'UNANSWERED'
  | 'MULTIPLE_ANSWERS'
  | 'LOW_CONFIDENCE'
  | 'INVALID_IMAGE';

export type ScanOverallStatus =
  | 'SUCCESS'
  | 'LOW_CONFIDENCE'
  | 'MULTIPLE_ANSWERS'
  | 'UNANSWERED'
  | 'INVALID_IMAGE'
  | 'QR_NOT_FOUND'
  | 'ANCHOR_NOT_FOUND'
  | 'NEEDS_REVIEW';

export interface StudentAnswerResult {
  id: string;
  scan_id: string;
  question_number: number;
  detected_answer: DetectedAnswerStatus;
  final_answer: DetectedAnswerStatus;
  confidence_score: number; // 0 to 1
  fill_ratios: { A: number; B: number; C: number; D: number; E?: number };
  is_correct: boolean;
}

export interface ScanRecord {
  id: string;
  paper_id: string;
  exam_id: string;
  version_id: string;
  student_id: string;
  raw_image_url?: string;
  warped_image_url?: string;
  overall_confidence: number;
  scan_status: ScanOverallStatus;
  total_score: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  review_count: number;
  percentage: number;
  scanned_at: string;
  answers: StudentAnswerResult[];
}

export interface ScanReviewRecord {
  id: string;
  scan_id: string;
  reviewed_by: string;
  reviewed_at: string;
  original_detected_answers_json: Record<number, DetectedAnswerStatus>;
  final_answers_json: Record<number, DetectedAnswerStatus>;
  review_reason: string;
}

export interface ItemAnalysisData {
  question_number: number;
  question_text: string;
  correct_answer: string;
  choice_counts: { A: number; B: number; C: number; D: number; E: number; UNANSWERED: number; MULTIPLE: number };
  total_responses: number;
  correct_count: number;
  wrong_count: number;
  correct_percentage: number; // Difficulty index
}
