-- Teacher Workbench Database Schema for Supabase PostgreSQL

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users table
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  school_name text,
  role text default 'teacher',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Contents table
create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  subject text not null,
  grade_level text,
  raw_text text,
  file_count integer default 1,
  status text default 'uploaded', -- uploaded, analyzed, ready
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Content Files table
create table if not exists public.content_files (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references public.contents(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_size integer not null,
  page_count integer default 1,
  storage_path text,
  weight_percentage float default 100.0,
  created_at timestamp with time zone default now()
);

-- 4. Content Profiles table
create table if not exists public.content_profiles (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references public.contents(id) on delete cascade,
  subject text not null,
  topic text not null,
  grade_level text,
  main_topics jsonb default '[]'::jsonb,
  sub_topics jsonb default '[]'::jsonb,
  key_concepts jsonb default '[]'::jsonb,
  vocabulary jsonb default '[]'::jsonb,
  learning_objectives jsonb default '[]'::jsonb,
  exam_topics jsonb default '[]'::jsonb,
  additional_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. Question Sets table
create table if not exists public.question_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  content_profile_id uuid references public.content_profiles(id) on delete set null,
  title text not null,
  subject text not null,
  grade_level text,
  total_questions integer not null,
  difficulty_distribution jsonb,
  cognitive_distribution jsonb,
  answer_distribution jsonb,
  quality_score text default 'PASS',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 6. Questions table
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  question_set_id uuid references public.question_sets(id) on delete cascade,
  question_order integer not null,
  type text not null, -- multiple_choice, true_false, fill_blank, matching, ordering, short_answer, essay, situation, coding
  question_text text not null,
  explanation text,
  difficulty text not null, -- easy, medium, hard
  cognitive_level text not null, -- remember, understand, apply, analyze, evaluate, create
  score float default 1.0,
  source_topic text,
  source_file text,
  source_page integer,
  quality_status text default 'PASS', -- PASS, WARNING, ERROR
  quality_issues jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- 7. Question Options table
create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.questions(id) on delete cascade,
  option_key text not null, -- A, B, C, D
  option_text text not null,
  is_correct boolean default false,
  option_order integer not null
);

-- 8. Worksheets table
create table if not exists public.worksheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  content_profile_id uuid references public.content_profiles(id) on delete set null,
  title text not null,
  subject text not null,
  grade_level text,
  total_score float,
  time_minutes integer,
  worksheet_type text not null, -- exercise, worksheet, activity_sheet, group_work, pbl, project, reflection
  sections jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- 9. Activities table
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  content_profile_id uuid references public.content_profiles(id) on delete set null,
  title text not null,
  duration text,
  group_type text, -- individual, pair, group
  grade_level text,
  objectives jsonb default '[]'::jsonb,
  materials jsonb default '[]'::jsonb,
  steps jsonb default '[]'::jsonb,
  student_instructions text,
  assessment_method text,
  rubric jsonb,
  created_at timestamp with time zone default now()
);

-- 10. Documents table (Summaries & Knowledge Sheets)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  content_profile_id uuid references public.content_profiles(id) on delete set null,
  title text not null,
  doc_type text default 'summary', -- summary, knowledge_sheet, key_takeaways, vocabulary_sheet, review_sheet
  content_markdown text not null,
  key_takeaways jsonb default '[]'::jsonb,
  vocabulary jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- Enable RLS for security
alter table public.users enable row level security;
alter table public.contents enable row level security;
alter table public.content_files enable row level security;
alter table public.content_profiles enable row level security;
alter table public.question_sets enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.worksheets enable row level security;
alter table public.activities enable row level security;
alter table public.documents enable row level security;
