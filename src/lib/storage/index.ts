import { ContentItem, ContentProfile, QuestionSet, Worksheet, Activity, LessonSummary, ExamBankItem } from '@/types';

const CONTENTS_KEY = 'teacher_workbench_contents';
const PROFILES_KEY = 'teacher_workbench_profiles';
const QUESTION_SETS_KEY = 'teacher_workbench_question_sets';
const WORKSHEETS_KEY = 'teacher_workbench_worksheets';
const ACTIVITIES_KEY = 'teacher_workbench_activities';
const SUMMARIES_KEY = 'teacher_workbench_summaries';
const EXAM_BANK_KEY = 'teacher_workbench_exam_bank';

// Helper for local storage access with SSR check
function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

export const StorageManager = {
  // --- Content Items ---
  getContents(): ContentItem[] {
    return getItem<ContentItem[]>(CONTENTS_KEY, []);
  },
  getContentById(id: string): ContentItem | undefined {
    return this.getContents().find((item) => item.id === id);
  },
  saveContent(item: ContentItem): ContentItem {
    const items = this.getContents();
    const index = items.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.unshift(item);
    }
    setItem(CONTENTS_KEY, items);
    return item;
  },
  deleteContent(id: string): void {
    const items = this.getContents().filter((item) => item.id !== id);
    setItem(CONTENTS_KEY, items);
  },

  // --- Content Profiles ---
  getProfiles(): ContentProfile[] {
    return getItem<ContentProfile[]>(PROFILES_KEY, []);
  },
  getProfileById(id: string): ContentProfile | undefined {
    return this.getProfiles().find((p) => p.id === id);
  },
  getProfileByContentId(contentId: string): ContentProfile | undefined {
    return this.getProfiles().find((p) => p.contentId === contentId);
  },
  saveProfile(profile: ContentProfile): ContentProfile {
    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === profile.id);
    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.unshift(profile);
    }
    setItem(PROFILES_KEY, profiles);
    return profile;
  },

  // --- Question Sets ---
  getQuestionSets(): QuestionSet[] {
    return getItem<QuestionSet[]>(QUESTION_SETS_KEY, []);
  },
  getQuestionSetById(id: string): QuestionSet | undefined {
    return this.getQuestionSets().find((qs) => qs.id === id);
  },
  saveQuestionSet(qs: QuestionSet): QuestionSet {
    const sets = this.getQuestionSets();
    const index = sets.findIndex((s) => s.id === qs.id);
    if (index >= 0) {
      sets[index] = qs;
    } else {
      sets.unshift(qs);
    }
    setItem(QUESTION_SETS_KEY, sets);
    return qs;
  },
  deleteQuestionSet(id: string): void {
    const sets = this.getQuestionSets().filter((s) => s.id !== id);
    setItem(QUESTION_SETS_KEY, sets);
  },

  // --- Worksheets ---
  getWorksheets(): Worksheet[] {
    return getItem<Worksheet[]>(WORKSHEETS_KEY, []);
  },
  getWorksheetById(id: string): Worksheet | undefined {
    return this.getWorksheets().find((w) => w.id === id);
  },
  saveWorksheet(ws: Worksheet): Worksheet {
    const list = this.getWorksheets();
    const idx = list.findIndex((w) => w.id === ws.id);
    if (idx >= 0) list[idx] = ws;
    else list.unshift(ws);
    setItem(WORKSHEETS_KEY, list);
    return ws;
  },

  // --- Activities ---
  getActivities(): Activity[] {
    return getItem<Activity[]>(ACTIVITIES_KEY, []);
  },
  getActivityById(id: string): Activity | undefined {
    return this.getActivities().find((a) => a.id === id);
  },
  saveActivity(act: Activity): Activity {
    const list = this.getActivities();
    const idx = list.findIndex((a) => a.id === act.id);
    if (idx >= 0) list[idx] = act;
    else list.unshift(act);
    setItem(ACTIVITIES_KEY, list);
    return act;
  },

  // --- Lesson Summaries ---
  getSummaries(): LessonSummary[] {
    return getItem<LessonSummary[]>(SUMMARIES_KEY, []);
  },
  getSummaryById(id: string): LessonSummary | undefined {
    return this.getSummaries().find((s) => s.id === id);
  },
  saveSummary(sum: LessonSummary): LessonSummary {
    const list = this.getSummaries();
    const idx = list.findIndex((s) => s.id === sum.id);
    if (idx >= 0) list[idx] = sum;
    else list.unshift(sum);
    setItem(SUMMARIES_KEY, list);
    return sum;
  },

  // --- Exam Bank ---
  getExamBank(): ExamBankItem[] {
    return getItem<ExamBankItem[]>(EXAM_BANK_KEY, []);
  },
  getExamBankById(id: string): ExamBankItem | undefined {
    return this.getExamBank().find((item) => item.id === id);
  },
  saveExamBank(item: ExamBankItem): ExamBankItem {
    const items = this.getExamBank();
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.unshift(item);
    }
    setItem(EXAM_BANK_KEY, items);
    return item;
  },
  deleteExamBank(id: string): void {
    const items = this.getExamBank().filter((item) => item.id !== id);
    setItem(EXAM_BANK_KEY, items);
  }
};
