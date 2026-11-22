export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'matching'
  | 'ordering'
  | 'short_answer'
  | 'essay'
  | 'situation'
  | 'coding'
  | 'coding_question';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type CognitiveLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

export interface ContentFile {
  id: string;
  contentId: string;
  fileName: string;
  fileType: string; // pdf, docx, pptx, txt, png, jpg
  fileSize: number;
  pageCount?: number;
  storagePath?: string;
  weightPercentage: number;
  createdAt: string;
}

export interface ContentItem {
  id: string;
  title: string;
  subject: string;
  gradeLevel?: string;
  rawText: string;
  fileCount: number;
  status: 'uploaded' | 'analyzed' | 'ready';
  createdAt: string;
  files: ContentFile[];
}

export interface ContentProfile {
  id: string;
  contentId: string;
  subject: string;
  topic: string;
  gradeLevel?: string;
  mainTopics: string[];
  subTopics: string[];
  keyConcepts: string[];
  vocabulary: { word: string; meaning: string }[];
  learningObjectives: string[];
  examTopics: string[];
  additionalNotes?: string;
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  optionKey: 'A' | 'B' | 'C' | 'D' | string;
  optionText: string;
  isCorrect: boolean;
}

export interface QualityIssue {
  questionOrder: number;
  severity: 'WARNING' | 'ERROR';
  code: string;
  message: string;
  recommendation: string;
}

export interface Question {
  id: string;
  questionSetId?: string;
  questionOrder: number;
  type: QuestionType;
  questionText: string;
  options?: QuestionOption[];
  correctAnswerText?: string; // For fill_blank, short_answer, ordering, etc.
  codeSnippet?: string;
  subItems?: { label: string; answer: string }[];
  explanation?: string;
  difficulty: DifficultyLevel;
  cognitiveLevel: CognitiveLevel;
  score: number;
  sourceTopic?: string;
  sourceFile?: string;
  sourcePage?: number;
  qualityStatus?: 'PASS' | 'WARNING' | 'ERROR';
  qualityIssues?: QualityIssue[];
}

export interface QualityCheckResult {
  overallStatus: 'PASS' | 'WARNING' | 'ERROR';
  answerDistribution: { A: number; B: number; C: number; D: number };
  difficultyDistribution: { easy: number; medium: number; hard: number };
  cognitiveDistribution: Record<CognitiveLevel, number>;
  issues: QualityIssue[];
}

export interface QuestionSet {
  id: string;
  contentProfileId?: string;
  title: string;
  subject: string;
  gradeLevel?: string;
  totalQuestions: number;
  difficultyDistribution: { easy: number; medium: number; hard: number };
  cognitiveDistribution: Record<CognitiveLevel, number>;
  answerDistribution?: { A: number; B: number; C: number; D: number };
  qualityScore: 'PASS' | 'WARNING' | 'ERROR';
  questions: Question[];
  createdAt: string;
}

export interface WorksheetSection {
  title: string;
  instructions: string;
  questions: {
    number: number;
    question: string;
    codeSnippet?: string;
    subItems?: { label: string; answer?: string }[];
    answerKey?: string;
    linesCount?: number;
    spaceType: 'lines' | 'box' | 'blank';
    score?: number;
  }[];
}

export interface Worksheet {
  id: string;
  contentProfileId?: string;
  schoolName?: string;
  teacherName?: string;
  title: string;
  subject: string;
  gradeLevel?: string;
  worksheetType: 'exercise' | 'worksheet' | 'activity_sheet' | 'group_work' | 'pbl' | 'project' | 'reflection';
  totalScore?: number;
  timeMinutes?: number;
  sections: WorksheetSection[];
  createdAt: string;
}

export interface ActivityStep {
  stepNumber: number;
  title: string;
  durationMinutes: number;
  description: string;
  teacherRole: string;
  studentRole: string;
}

export interface Activity {
  id: string;
  contentProfileId?: string;
  title: string;
  duration: string;
  groupType: 'individual' | 'pair' | 'group';
  gradeLevel?: string;
  objectives: string[];
  materials: string[];
  steps: ActivityStep[];
  studentInstructions: string;
  assessmentMethod: string;
  rubric: {
    criteria: string;
    excellent: string;
    good: string;
    fair: string;
  }[];
  createdAt: string;
}

export interface LessonSummary {
  id: string;
  contentProfileId?: string;
  title: string;
  subject: string;
  gradeLevel?: string;
  docType: 'summary' | 'knowledge_sheet' | 'key_takeaways' | 'vocabulary_sheet' | 'review_sheet';
  contentMarkdown: string;
  keyTakeaways: string[];
  vocabulary: { word: string; meaning: string }[];
  reviewQuestions?: string[];
  createdAt: string;
}

export interface ExamBankItem {
  id: string;
  title: string;
  subject: string;
  gradeLevel?: string;
  questionsCount: number;
  questions: {
    id: string;
    text: string;
    type?: 'multiple_choice' | 'fill_blank' | 'essay' | 'matching' | 'coding_output';
    imageUrl?: string | null;
    options: string[];
    answerIndex: number;
    correctAnswerText?: string;
    matchingPairs?: { left: string; right: string }[];
    codeSnippet?: string;
    subItems?: { label: string; answer: string }[];
  }[];
  generatedVersions?: {
    versionCode: string;
    questions: {
      questionIndexOriginal: number;
      text: string;
      type?: 'multiple_choice' | 'fill_blank' | 'essay' | 'matching' | 'coding_output';
      imageUrl?: string | null;
      options: { text: string; originalIndex: number }[];
      correctOptionIndex: number;
      correctAnswerText?: string;
      matchingPairs?: { left: string; right: string }[];
      codeSnippet?: string;
      subItems?: { label: string; answer: string }[];
    }[];
  }[];
  headerConfig?: {
    schoolName?: string;
    examTitle?: string;
    subjectName?: string;
    teacherName?: string;
    examTime?: string;
    instructionText?: string;
    logoUrl?: string | null;
    sectionHeadersConfig?: {
      mcTitle?: string;
      mcInstruction?: string;
      matchingTitle?: string;
      matchingInstruction?: string;
      fillTitle?: string;
      fillInstruction?: string;
      essayTitle?: string;
      essayInstruction?: string;
    };
  };
  createdAt: string;
}
