-- OMR Exam System Database Schema for Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) UNIQUE NOT NULL,
    student_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Students
CREATE INDEX IF NOT EXISTS idx_students_student_code ON public.students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_class_name ON public.students(class_name);

-- 2. EXAMS TABLE
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    description TEXT,
    total_questions INT NOT NULL DEFAULT 40,
    choices_count INT NOT NULL DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_exam_code ON public.exams(exam_code);

-- 3. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    question_number INT NOT NULL,
    question_text TEXT NOT NULL,
    choice_a TEXT NOT NULL,
    choice_b TEXT NOT NULL,
    choice_c TEXT NOT NULL,
    choice_d TEXT NOT NULL,
    choice_e TEXT,
    correct_answer VARCHAR(1) NOT NULL,
    CONSTRAINT unique_question_per_exam UNIQUE(exam_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON public.questions(exam_id);

-- 4. EXAM VERSIONS TABLE (A, B, C, D)
CREATE TABLE IF NOT EXISTS public.exam_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    version_code VARCHAR(5) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_version_per_exam UNIQUE(exam_id, version_code)
);

CREATE INDEX IF NOT EXISTS idx_versions_exam_id ON public.exam_versions(exam_id);

-- 5. VERSION QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.version_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES public.exam_versions(id) ON DELETE CASCADE,
    question_number_in_version INT NOT NULL,
    original_question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    shuffled_choices_json JSONB NOT NULL,
    correct_choice_in_version VARCHAR(1) NOT NULL
);

-- 6. ANSWER SHEETS TABLE
CREATE TABLE IF NOT EXISTS public.answer_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES public.exam_versions(id) ON DELETE CASCADE,
    qr_payload VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sheets_paper_id ON public.answer_sheets(paper_id);
CREATE INDEX IF NOT EXISTS idx_sheets_student_id ON public.answer_sheets(student_id);
CREATE INDEX IF NOT EXISTS idx_sheets_exam_id ON public.answer_sheets(exam_id);

-- 7. SCANS TABLE
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id VARCHAR(50) NOT NULL REFERENCES public.answer_sheets(paper_id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES public.exam_versions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    raw_image_url TEXT,
    warped_image_url TEXT,
    overall_confidence NUMERIC(5,2) DEFAULT 1.00,
    scan_status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    total_score NUMERIC(5,2) DEFAULT 0,
    correct_count INT DEFAULT 0,
    wrong_count INT DEFAULT 0,
    unanswered_count INT DEFAULT 0,
    review_count INT DEFAULT 0,
    percentage NUMERIC(5,2) DEFAULT 0,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scans_scan_status ON public.scans(scan_status);
CREATE INDEX IF NOT EXISTS idx_scans_paper_id ON public.scans(paper_id);

-- 8. STUDENT ANSWERS TABLE
CREATE TABLE IF NOT EXISTS public.student_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    question_number INT NOT NULL,
    detected_answer VARCHAR(20) NOT NULL,
    final_answer VARCHAR(20) NOT NULL,
    confidence_score NUMERIC(5,2) DEFAULT 1.00,
    fill_ratios_json JSONB NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE
);

-- 9. SCAN REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.scan_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    reviewed_by VARCHAR(100) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    original_detected_answers_json JSONB NOT NULL,
    final_answers_json JSONB NOT NULL,
    review_reason TEXT
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.version_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_reviews ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated/anon for Workbench demo usage
CREATE POLICY "Allow read access to all" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow all operations for students" ON public.students FOR ALL USING (true);

CREATE POLICY "Allow read access to all exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Allow all operations for exams" ON public.exams FOR ALL USING (true);

CREATE POLICY "Allow all operations for questions" ON public.questions FOR ALL USING (true);
CREATE POLICY "Allow all operations for versions" ON public.exam_versions FOR ALL USING (true);
CREATE POLICY "Allow all operations for version_questions" ON public.version_questions FOR ALL USING (true);
CREATE POLICY "Allow all operations for answer_sheets" ON public.answer_sheets FOR ALL USING (true);
CREATE POLICY "Allow all operations for scans" ON public.scans FOR ALL USING (true);
CREATE POLICY "Allow all operations for student_answers" ON public.student_answers FOR ALL USING (true);
CREATE POLICY "Allow all operations for scan_reviews" ON public.scan_reviews FOR ALL USING (true);
