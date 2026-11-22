'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { FormattedMathText } from '@/components/common/FormattedMathText';
import { MathToolbar } from '@/components/common/MathToolbar';
import { generateWorksheetDocx } from '@/lib/exporters';
import {
  Shuffle,
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
  Download,
  Sparkles,
  Loader2,
  Printer,
  Copy,
  Layers,
  Upload,
  X,
  Image as ImageIcon,
  ScanText,
  Camera,
  Save,
  BookOpen,
  FolderPlus,
  FolderDown,
  Archive,
  Search,
  Edit3,
  FileEdit,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StorageManager } from '@/lib/storage';
import { ExamBankItem, Worksheet, WorksheetSection } from '@/types';

interface Question {
  id: string;
  text: string;
  section?: 1 | 2 | 3 | 4;
  type?: 'multiple_choice' | 'fill_blank' | 'essay' | 'matching' | 'coding_output';
  options: string[];
  answerIndex: number;
  correctAnswerText?: string;
  matchingPairs?: { left: string; right: string }[];
  codeSnippet?: string;
  subItems?: { label: string; answer: string }[];
  imageUrl?: string | null;
}

interface ExamVersion {
  versionCode: string; // "A", "B", "C"
  questions: {
    questionIndexOriginal: number;
    text: string;
    section?: 1 | 2 | 3 | 4;
    type?: 'multiple_choice' | 'fill_blank' | 'essay' | 'matching' | 'coding_output';
    imageUrl?: string | null;
    options: { text: string; originalIndex: number }[];
    correctOptionIndex: number; // New index of the correct answer in shuffled options
    correctAnswerText?: string;
    matchingPairs?: { left: string; right: string }[];
    codeSnippet?: string;
    subItems?: { label: string; answer: string }[];
  }[];
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'ดาวเคราะห์วงในในระบบสุริยะมีกี่ดวง',
    options: ['2 ดวง', '3 ดวง', '4 ดวง', '5 ดวง'],
    answerIndex: 2,
  },
  {
    id: 'q2',
    text: 'ข้อใดเป็นแก๊สที่มีปริมาณมากที่สุดในบรรยากาศของโลก',
    options: ['ออกซิเจน', 'ไนโตรเจน', 'คาร์บอนไดออกไซด์', 'อาร์กอน'],
    answerIndex: 1,
  },
  {
    id: 'q3',
    text: 'กระบวนการสังเคราะห์ด้วยแสงของพืชเกิดขึ้นที่โครงสร้างใด',
    options: ['ไมโทคอนเดรีย', 'คลอโรพลาสต์', 'ไรโบโซม', 'นิวเคลียส'],
    answerIndex: 1,
  },
  {
    id: 'q4',
    text: 'การหมุนรอบตัวเองของโลกทำให้เกิดปรากฏการณ์ใด',
    options: ['เกิดกลางวัน-กลางคืน', 'เกิดฤดูกาล', 'เกิดข้างขึ้น-ข้างแรม', 'เกิดสุริยุปราคา'],
    answerIndex: 0,
  },
  {
    id: 'q-code-sample',
    type: 'coding_output',
    text: 'เติมผลลัพธ์จากการเข้าถึงข้อมูล (5 คะแนน)',
    codeSnippet: `# กำหนดโค้ดดังนี้\ntemperature = [28, 31, 29, 33, 35, 30]\nprint(temperature[0])\nprint(temperature[3])\nprint(temperature[5])\n\n# กำหนดอาร์เรย์ 2 มิติดังนี้\ndata = [\n    [12, 15, 18],\n    [21, 24, 27],\n    [30, 33, 36]\n]\nprint(data[2][1])\nprint(data[0][2])`,
    subItems: [
      { label: 'temperature[0]', answer: '28' },
      { label: 'temperature[3]', answer: '33' },
      { label: 'temperature[5]', answer: '30' },
      { label: 'data[2][1]', answer: '33' },
      { label: 'data[0][2]', answer: '18' },
    ],
    options: ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
    answerIndex: 0,
    correctAnswerText: '1) 28, 2) 33, 3) 30, 4) 33, 5) 18',
  },
];

const CHOICE_LABELS = ['ก', 'ข', 'ค', 'ง', 'จ'];

const cleanOptionText = (text: string): string => {
  if (!text) return '';
  return text.replace(/^[\(\[]?\s*[ก-งa-eA-E1-5]\s*[\:\.\)\]]+\s*/, '').trim();
};

const formatInstructionsToList = (text: string): string[] => {
  if (!text || !text.trim()) return [];

  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const result: string[] = [];

  for (const line of rawLines) {
    const parts = line
      .split(/(?=(?:\s+|^)(?:\d+|[ก-ฮa-zA-Z])[\.\)\:]\s+)/g)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const part of parts) {
      result.push(part);
    }
  }

  return result;
};

export default function ExamShufflerPage() {
  const [questions, setQuestions] = useState<Question[]>(SAMPLE_QUESTIONS);
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<'paste' | 'edit' | 'bank' | 'results'>('results');

  const [examBankList, setExamBankList] = useState<ExamBankItem[]>([]);
  const [showTeacherKeyOnPaper, setShowTeacherKeyOnPaper] = useState(false);
  const [copiedKeySuccess, setCopiedKeySuccess] = useState(false);

  const [saveBankModalOpen, setSaveBankModalOpen] = useState(false);
  const [bankTitleInput, setBankTitleInput] = useState('');
  const [bankSubjectInput, setBankSubjectInput] = useState('');
  const [bankSearch, setBankSearch] = useState('');

  const [fontFamily, setFontFamily] = useState<'Sarabun' | 'Prompt' | 'Kanit'>('Sarabun');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');

  const [resultViewMode, setResultViewMode] = useState<'paper' | 'sheet' | 'key'>('paper');
  const [sheetMarkType, setSheetMarkType] = useState<'cross' | 'bubble'>('cross');
  const [sheetBoxSize, setSheetBoxSize] = useState<'medium' | 'large' | 'xlarge'>('large');
  const [sheetOptionStyle, setSheetOptionStyle] = useState<'thai' | 'english'>('thai');
  const [paperSpacing, setPaperSpacing] = useState<'compact' | 'normal' | 'spacious'>('compact');
  const [paperColumns, setPaperColumns] = useState<1 | 2>(2);

  // Section Headers & Instructions per Question Type
  const [mcTitle, setMcTitle] = useState('ตอนที่ 1: ข้อสอบแบบเลือกตอบ (ปรนัย)');
  const [mcInstruction, setMcInstruction] = useState('ให้นักเรียนเลือกตัวเลือกที่ถูกต้องที่สุดเพียงข้อเดียว');
  const [matchingTitle, setMatchingTitle] = useState('ตอนที่ 2: ข้อสอบแบบจับคู่');
  const [matchingInstruction, setMatchingInstruction] = useState('ให้นักเรียนนำตัวอักษรทางขวามือ เติมลงในช่อง [   ] หน้าข้อความทางซ้ายมือให้สัมพันธ์กัน');
  const [fillTitle, setFillTitle] = useState('ตอนที่ 2: ข้อสอบแบบเติมคำตอบ / เติมผลลัพธ์โค้ดโปรแกรม');
  const [fillInstruction, setFillInstruction] = useState('ให้นักเรียนเขียนคำตอบหรือผลลัพธ์ที่ถูกต้องลงในช่องว่างที่กำหนดให้');
  const [essayTitle, setEssayTitle] = useState('ตอนที่ 3: ข้อสอบแบบแสดงวิธีทำ (อัตนัย)');
  const [essayInstruction, setEssayInstruction] = useState('ให้นักเรียนเขียนแสดงวิธีทำ หรือคำนวณหาคำตอบโดยละเอียด');
  const [showSectionConfig, setShowSectionConfig] = useState(false);

  // Bank Edit Modal & Sync States
  const [activeBankId, setActiveBankId] = useState<string | null>(null);
  const [editBankModalOpen, setEditBankModalOpen] = useState(false);
  const [editingBankItem, setEditingBankItem] = useState<ExamBankItem | null>(null);

  useEffect(() => {
    setExamBankList(StorageManager.getExamBank());
    buildExamVersions(SAMPLE_QUESTIONS);
  }, []);

  const handleSaveToBank = () => {
    if (!questions || questions.length === 0) {
      alert('ไม่มีรายการข้อสอบให้บันทึก');
      return;
    }

    const title = bankTitleInput.trim() || examTitle || 'ชุดข้อสอบบันทึกใหม่';
    const subject = bankSubjectInput.trim() || subjectName || 'วิชาทั่วไป';
    const itemId = activeBankId || `bank-${Date.now()}`;

    const newItem: ExamBankItem = {
      id: itemId,
      title,
      subject,
      questionsCount: questions.length,
      questions,
      generatedVersions,
      headerConfig: {
        schoolName,
        examTitle,
        subjectName,
        teacherName,
        examTime,
        instructionText,
        logoUrl,
        sectionHeadersConfig: {
          mcTitle,
          mcInstruction,
          matchingTitle,
          matchingInstruction,
          fillTitle,
          fillInstruction,
          essayTitle,
          essayInstruction,
        },
      },
      createdAt: activeBankId
        ? (examBankList.find((b) => b.id === activeBankId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
    };

    StorageManager.saveExamBank(newItem);
    setExamBankList(StorageManager.getExamBank());
    setSaveBankModalOpen(false);
    setBankTitleInput('');
    setBankSubjectInput('');
    alert(`บันทึก/อัปเดต "${title}" ลงคลังข้อสอบเรียบร้อยแล้ว!`);
  };

  const handleLoadFromBank = (item: ExamBankItem) => {
    if (item.questions && item.questions.length > 0) {
      setQuestions(item.questions);
    }
    if (item.headerConfig) {
      if (item.headerConfig.schoolName) setSchoolName(item.headerConfig.schoolName);
      if (item.headerConfig.examTitle) setExamTitle(item.headerConfig.examTitle);
      if (item.headerConfig.subjectName) setSubjectName(item.headerConfig.subjectName);
      if (item.headerConfig.teacherName) setTeacherName(item.headerConfig.teacherName);
      if (item.headerConfig.examTime) setExamTime(item.headerConfig.examTime);
      if (item.headerConfig.instructionText) setInstructionText(item.headerConfig.instructionText);
      if (item.headerConfig.logoUrl !== undefined) setLogoUrl(item.headerConfig.logoUrl);

      if (item.headerConfig.sectionHeadersConfig) {
        const sh = item.headerConfig.sectionHeadersConfig;
        if (sh.mcTitle) setMcTitle(sh.mcTitle);
        if (sh.mcInstruction) setMcInstruction(sh.mcInstruction);
        if (sh.matchingTitle) setMatchingTitle(sh.matchingTitle);
        if (sh.matchingInstruction) setMatchingInstruction(sh.matchingInstruction);
        if (sh.fillTitle) setFillTitle(sh.fillTitle);
        if (sh.fillInstruction) setFillInstruction(sh.fillInstruction);
        if (sh.essayTitle) setEssayTitle(sh.essayTitle);
        if (sh.essayInstruction) setEssayInstruction(sh.essayInstruction);
      }
    }

    if (item.generatedVersions && item.generatedVersions.length > 0) {
      setGeneratedVersions(item.generatedVersions);
      setActivePreviewVersion('A');
      setActiveTab('results');
    } else {
      buildExamVersions(item.questions || questions);
    }
    alert(`ดึงข้อสอบชุด "${item.title}" เข้าสู่ระบบสลับข้อสอบเรียบร้อยแล้ว!`);
  };

  const handleOpenEditBankModal = (item: ExamBankItem) => {
    setEditingBankItem({ ...item });
    setEditBankModalOpen(true);
  };

  const handleSaveEditBankModal = () => {
    if (!editingBankItem) return;
    StorageManager.saveExamBank(editingBankItem);
    setExamBankList(StorageManager.getExamBank());
    setEditBankModalOpen(false);
    setEditingBankItem(null);
    alert('อัปเดตข้อมูลชุดข้อสอบในคลังเรียบร้อยแล้ว!');
  };

  const handleEditBankQuestionsInEditor = (item: ExamBankItem) => {
    setActiveBankId(item.id);
    setBankTitleInput(item.title);
    setBankSubjectInput(item.subject);

    if (item.questions && item.questions.length > 0) {
      setQuestions(item.questions);
    }
    if (item.headerConfig) {
      if (item.headerConfig.schoolName) setSchoolName(item.headerConfig.schoolName);
      if (item.headerConfig.examTitle) setExamTitle(item.headerConfig.examTitle);
      if (item.headerConfig.subjectName) setSubjectName(item.headerConfig.subjectName);
      if (item.headerConfig.teacherName) setTeacherName(item.headerConfig.teacherName);
      if (item.headerConfig.examTime) setExamTime(item.headerConfig.examTime);
      if (item.headerConfig.instructionText) setInstructionText(item.headerConfig.instructionText);
      if (item.headerConfig.logoUrl !== undefined) setLogoUrl(item.headerConfig.logoUrl);

      if (item.headerConfig.sectionHeadersConfig) {
        const sh = item.headerConfig.sectionHeadersConfig;
        if (sh.mcTitle) setMcTitle(sh.mcTitle);
        if (sh.mcInstruction) setMcInstruction(sh.mcInstruction);
        if (sh.matchingTitle) setMatchingTitle(sh.matchingTitle);
        if (sh.matchingInstruction) setMatchingInstruction(sh.matchingInstruction);
        if (sh.fillTitle) setFillTitle(sh.fillTitle);
        if (sh.fillInstruction) setFillInstruction(sh.fillInstruction);
        if (sh.essayTitle) setEssayTitle(sh.essayTitle);
        if (sh.essayInstruction) setEssayInstruction(sh.essayInstruction);
      }
    }

    setActiveTab('edit');
    alert(`ดึงข้อสอบ "${item.title}" เข้าสู่โหมดแก้ไขตัวโจทย์แล้ว! เมื่อแก้ไขเสร็จกดปุ่ม "💾 อัปเดตชุดข้อสอบในคลัง" ได้เลย`);
  };

  const handleDeleteFromBank = (id: string, title: string) => {
    if (confirm(`คุณต้องการลบชุดข้อสอบ "${title}" ออกจากคลังใช่หรือไม่?`)) {
      StorageManager.deleteExamBank(id);
      setExamBankList(StorageManager.getExamBank());
    }
  };

  // Config Header Fields
  const [schoolName, setSchoolName] = useState('โรงเรียนสาธิตการศึกษา');
  const [examTitle, setExamTitle] = useState('แบบทดสอบวัดผลสัมฤทธิ์ทางการเรียน');
  const [subjectName, setSubjectName] = useState('วิชา วิทยาศาสตร์และเทคโนโลยี (ว21101)');
  const [teacherName, setTeacherName] = useState('ครูผู้สอน: ครูสมชาย');
  const [examTime, setExamTime] = useState('เวลาในการทำ: 60 นาที');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [instructionText, setInstructionText] = useState(
    '1. ให้ทำเครื่องหมายกากบาท (X) หรือฝนทับตัวเลือกที่ถูกต้องเพียงข้อเดียวลงในกระดาษคำตอบ\n2. ข้อสอบมีทั้งหมด 10 ข้อ คะแนนเต็ม 10 คะแนน\n3. ห้ามขีดเขียนข้อความใดๆ นอกเหนือจากตำแหน่งที่กำหนดไว้'
  );

  const [versionCount, setVersionCount] = useState<number>(3);
  const [choiceLayout, setChoiceLayout] = useState<'auto' | '1' | '2' | '4'>('auto');
  const [shuffleQ, setShuffleQ] = useState(true);
  const [shuffleOpt, setShuffleOpt] = useState(true);

  // Generated Versions
  const [generatedVersions, setGeneratedVersions] = useState<ExamVersion[]>([]);
  const [activePreviewVersion, setActivePreviewVersion] = useState<string>('A');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const examImageInputRef = useRef<HTMLInputElement>(null);
  const [isOcrScanning, setIsOcrScanning] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExamImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsOcrScanning(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setRawText((prev) => (prev.trim() ? `${prev.trim()}\n\n${data.text}` : data.text));
        } else {
          alert('ไม่พบข้อความในรูปภาพ กรุณาถ่ายภาพภาพข้อสอบให้คมชัดยิ่งขึ้น');
        }
      } else {
        alert('เกิดข้อผิดพลาดในการสแกนรูปภาพ');
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถอ่านข้อความจากรูปภาพได้');
    } finally {
      setIsOcrScanning(false);
      if (e.target) e.target.value = '';
    }
  };

  // Fisher-Yates shuffle
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Client-side Fallback Text Parser
  const parseExamTextClient = (text: string): Question[] => {
    const hasCodePattern =
      /print\s*\(/.test(text) ||
      /\w+\s*=\s*\[/.test(text) ||
      /\d+\.\s*\w+\[\d+\]\s*=\s*\.{2,}/.test(text);

    if (hasCodePattern) {
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      let titleText = 'จงเติมผลลัพธ์ที่ได้จากการทำงานของโปรแกรม';
      const codeBlocks: string[] = [];
      const subItems: { label: string; answer: string }[] = [];

      const formatCodeClient = (rawCode: string): string =>
        rawCode
          .replace(/\]\s*print\(/g, ']\nprint(')
          .replace(/\)\s*print\(/g, ')\nprint(')
          .replace(/\[\s*\[/g, '[\n    [')
          .replace(/\],\s*\[/g, '],\n    [')
          .replace(/\]\s*\]/g, ']\n]')
          .trim();

      const evalArrClient = (code: string, expr: string): string => {
        try {
          const m2 = expr.match(/([a-zA-Z_]\w*)\[(\d+)\]\[(\d+)\]/);
          if (m2) {
            const reg = new RegExp(`${m2[1]}\\s*=\\s*(\\[\\s*\\[[^;]+?\\]\\s*\\])`);
            const m = code.match(reg);
            if (m) {
              const arr = JSON.parse(m[1]);
              if (arr[Number(m2[2])]?.[Number(m2[3])] !== undefined) return String(arr[Number(m2[2])][Number(m2[3])]);
            }
          }
          const m1 = expr.match(/([a-zA-Z_]\w*)\[(\d+)\]/);
          if (m1) {
            const reg = new RegExp(`${m1[1]}\\s*=\\s*(\\[[^\\[\\]]+?\\])`);
            const m = code.match(reg);
            if (m) {
              const arr = JSON.parse(m[1]);
              if (arr[Number(m1[2])] !== undefined) return String(arr[Number(m1[2])]);
            }
          }
        } catch {
          // ignore
        }
        return '';
      };

      for (const line of lines) {
        const subMatch = line.match(/^(?:\d+[\.\)]\s*)?(.+?)\s*=\s*[\.\_]{2,}(.*)$/);
        if (subMatch) {
          const label = subMatch[1].trim();
          const ans = evalArrClient(codeBlocks.join('\n'), label);
          subItems.push({ label, answer: ans });
          continue;
        }
        if (/^[a-zA-Z_]\w*\s*=\s*\[/.test(line) || /print\s*\(/.test(line)) {
          codeBlocks.push(formatCodeClient(line));
          continue;
        }
        if (!line.startsWith('กำหนด') && !line.startsWith('จงเติม') && titleText === 'จงเติมผลลัพธ์ที่ได้จากการทำงานของโปรแกรม') {
          titleText = line;
        }
      }

      if (subItems.length > 0 || codeBlocks.length > 0) {
        return [
          {
            id: `q-code-${Date.now()}`,
            type: 'coding_output',
            text: titleText,
            codeSnippet: codeBlocks.join('\n\n'),
            subItems,
            options: ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
            answerIndex: 0,
            correctAnswerText: subItems.map((s, i) => `${i + 1}) ${s.label} = ${s.answer}`).join(', '),
          },
        ];
      }
    }

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const result: Question[] = [];
    let currentText = '';
    let currentOptions: string[] = [];
    let currentAnsIdx = 0;

    const commitQuestion = () => {
      if (currentText) {
        result.push({
          id: `q-${result.length + 1}-${Date.now()}`,
          text: currentText,
          options: currentOptions.length > 0 ? currentOptions : ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
          answerIndex: currentAnsIdx,
        });
      }
      currentText = '';
      currentOptions = [];
      currentAnsIdx = 0;
    };

    let inAnswerBlock = false;
    const answerBlockLines: string[] = [];

    for (const line of lines) {
      // Check if entering a separate answer block section at the end
      if (/^(?:เฉลย|เฉลยคำตอบ|เฉลยข้อสอบ|คำตอบ|answer\s*key)[\s\:\=]*$/i.test(line)) {
        inAnswerBlock = true;
        commitQuestion();
        continue;
      }

      if (inAnswerBlock) {
        answerBlockLines.push(line);
        continue;
      }

      const qMatch = line.match(/^(?:ข้อ\s*)?(\d+)[\.\s\:\)]\s*(.+)/i);
      const optMatch = line.match(/^[\(\[]?\s*([ก-งa-d1-4])\s*[\:\.\)\]]*\s*(.+)/i);
      const ansMatch = line.match(/^(?:เฉลย|ตอบ|เฉลยข้อ|answer)[\s\:\=]*([ก-งa-d1-4])/i);

      if (ansMatch) {
        const char = ansMatch[1].toUpperCase();
        const map: Record<string, number> = { 'ก': 0, 'ข': 1, 'ค': 2, 'ง': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3, '1': 0, '2': 1, '3': 2, '4': 3 };
        if (map[char] !== undefined) currentAnsIdx = map[char];
      } else if (optMatch) {
        currentOptions.push(cleanOptionText(optMatch[2]));
      } else if (qMatch) {
        commitQuestion();
        currentText = qMatch[2];
      } else if (currentText && !line.startsWith('เฉลย') && !line.startsWith('ตอบ')) {
        if (currentOptions.length === 0) {
          currentText += ' ' + line;
        }
      }
    }
    commitQuestion();

    // Separate Answer Key Block matching (e.g. 1. ก, 2. ข, 3. ค, 4. ง)
    if (answerBlockLines.length > 0 && result.length > 0) {
      const fullAnswerText = answerBlockLines.join(' ');
      const matches = fullAnswerText.matchAll(/(?:ข้อ\s*)?(\d+)[\.\s\:\-\)]+([ก-งa-d1-4])/gi);
      for (const m of matches) {
        const qIdx = parseInt(m[1], 10) - 1;
        const char = m[2].toUpperCase();
        const map: Record<string, number> = { 'ก': 0, 'ข': 1, 'ค': 2, 'ง': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3, '1': 0, '2': 1, '3': 2, '4': 3 };
        if (qIdx >= 0 && qIdx < result.length && map[char] !== undefined) {
          result[qIdx].answerIndex = map[char];
        }
      }
    }

    return result;
  };

  const getOptionGridClass = (options: { text: string }[]) => {
    if (choiceLayout === '1') return 'grid grid-cols-1 space-y-0.5';
    if (choiceLayout === '2') return 'grid grid-cols-2 gap-x-2 gap-y-0.5';
    if (choiceLayout === '4') return 'grid grid-cols-4 gap-x-2 gap-y-0.5';

    // AUTO:
    const maxLen = Math.max(...options.map((o) => cleanOptionText(o.text).length));
    if (paperColumns === 2) {
      if (maxLen > 14) {
        return 'grid grid-cols-1 space-y-0.5';
      } else {
        return 'grid grid-cols-2 gap-x-2 gap-y-0.5';
      }
    }
    if (maxLen > 22) {
      return 'grid grid-cols-1 space-y-1';
    } else if (maxLen > 10) {
      return 'grid grid-cols-2 gap-x-4 gap-y-1';
    } else {
      return 'grid grid-cols-4 gap-x-3 gap-y-1';
    }
  };

  const buildExamVersions = (qs: Question[]) => {
    if (qs.length === 0) return;

    const versionLabels = ['A', 'B', 'C', 'D', 'E'].slice(0, versionCount);
    const resultVersions: ExamVersion[] = [];

    const getSectionNumber = (q: Question): 1 | 2 | 3 | 4 => {
      if (q.section) return q.section;
      const t = q.type || 'multiple_choice';
      if (t === 'multiple_choice') return 1;
      if (t === 'coding_output' || t === 'fill_blank' || t === 'matching') return 2;
      if (t === 'essay') return 3;
      return 1;
    };

    versionLabels.forEach((label) => {
      const indexed = qs.map((q, origIdx) => ({
        q: { ...q, section: getSectionNumber(q) },
        origIdx,
      }));

      // Group by section (1, 2, 3, 4) so Section 1, Section 2, Section 3 stay grouped cleanly!
      const groups: Record<number, { q: Question; origIdx: number }[]> = { 1: [], 2: [], 3: [], 4: [] };
      indexed.forEach((item) => {
        const sec = item.q.section || 1;
        groups[sec].push(item);
      });

      let qList: { q: Question; origIdx: number }[] = [];
      [1, 2, 3, 4].forEach((sec) => {
        let groupItems = groups[sec];
        if (shuffleQ && label !== 'A') {
          groupItems = shuffleArray(groupItems);
        }
        qList = qList.concat(groupItems);
      });

      const shuffledQuestions = qList.map(({ q, origIdx }) => {
        let optList = q.options.map((optText, optOrigIdx) => ({
          text: optText,
          originalIndex: optOrigIdx,
        }));

        if (shuffleOpt && label !== 'A') {
          optList = shuffleArray(optList);
        }

        const correctIndex = optList.findIndex((item) => item.originalIndex === q.answerIndex);

        return {
          questionIndexOriginal: origIdx,
          text: q.text,
          section: q.section || getSectionNumber(q),
          type: q.type || 'multiple_choice',
          imageUrl: q.imageUrl || null,
          options: optList,
          correctOptionIndex: correctIndex,
          correctAnswerText: q.correctAnswerText || '',
          matchingPairs: q.matchingPairs || [],
          codeSnippet: q.codeSnippet || '',
          subItems: q.subItems || [],
        };
      });

      resultVersions.push({
        versionCode: label,
        questions: shuffledQuestions,
      });
    });

    setGeneratedVersions(resultVersions);
    setActivePreviewVersion('A');
    setActiveTab('results');
  };

  const handleParseText = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    try {
      const res = await fetch('/api/shuffle-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });
      const data = await res.json();
      let parsedQuestions: Question[] = [];
      if (data.questions && data.questions.length > 0) {
        parsedQuestions = data.questions;
      } else {
        parsedQuestions = parseExamTextClient(rawText);
      }

      if (parsedQuestions.length > 0) {
        setQuestions(parsedQuestions);
        buildExamVersions(parsedQuestions);
      } else {
        alert('ไม่สามารถแปลงข้อสอบได้ กรุณาตรวจสอบรูปแบบข้อความ');
      }
    } catch (e) {
      console.error(e);
      const fallback = parseExamTextClient(rawText);
      if (fallback.length > 0) {
        setQuestions(fallback);
        buildExamVersions(fallback);
      } else {
        alert('เกิดข้อผิดพลาดในการแปลงข้อสอบ');
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddQuestion = (
    type?: 'multiple_choice' | 'fill_blank' | 'essay' | 'matching' | 'coding_output',
    sectionOverride?: 1 | 2 | 3 | 4
  ) => {
    const lastQ = questions.length > 0 ? questions[questions.length - 1] : null;
    const lastSec = lastQ
      ? lastQ.section ||
        (lastQ.type === 'coding_output' || lastQ.type === 'fill_blank' || lastQ.type === 'matching'
          ? 2
          : lastQ.type === 'essay'
          ? 3
          : 1)
      : 1;
    const inheritedSection: 1 | 2 | 3 | 4 = sectionOverride || (lastSec as 1 | 2 | 3 | 4);
    const resolvedType =
      type ||
      (inheritedSection === 1
        ? 'multiple_choice'
        : inheritedSection === 3
        ? 'essay'
        : inheritedSection === 4
        ? 'matching'
        : lastQ?.type && lastQ.type !== 'multiple_choice'
        ? lastQ.type
        : 'coding_output');

    const newQ: Question = {
      id: `q-${Date.now()}`,
      section: inheritedSection,
      text:
        resolvedType === 'multiple_choice'
          ? `คำถามข้อที่ ${questions.length + 1}`
          : resolvedType === 'fill_blank'
          ? `จงเติมคำในช่องว่างให้ถูกต้อง ข้อที่ ${questions.length + 1}`
          : resolvedType === 'essay'
          ? `จงอธิบายและแสดงวิธีทำ ข้อที่ ${questions.length + 1}`
          : resolvedType === 'coding_output'
          ? `เติมผลลัพธ์จากการเข้าถึงข้อมูล (5 คะแนน)`
          : `จงจับคู่ข้อความฝั่งซ้ายและฝั่งขวาให้สัมพันธ์กัน ข้อที่ ${questions.length + 1}`,
      type: resolvedType,
      options: ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
      answerIndex: 0,
      correctAnswerText: '',
      codeSnippet:
        resolvedType === 'coding_output'
          ? `# กำหนดโค้ดดังนี้\ntemperature = [28, 31, 29, 33, 35, 30]\nprint(temperature[0])\nprint(temperature[3])\nprint(temperature[5])\n\n# กำหนดอาร์เรย์ 2 มิติดังนี้\ndata = [\n    [12, 15, 18],\n    [21, 24, 27],\n    [30, 33, 36]\n]\nprint(data[2][1])\nprint(data[0][2])`
          : '',
      subItems:
        resolvedType === 'coding_output'
          ? [
              { label: 'temperature[0]', answer: '28' },
              { label: 'temperature[3]', answer: '33' },
              { label: 'temperature[5]', answer: '30' },
              { label: 'data[2][1]', answer: '33' },
              { label: 'data[0][2]', answer: '18' },
            ]
          : [],
      matchingPairs: [
        { left: 'รายการที่ 1 ฝั่งซ้าย', right: 'คำตอบ ก (ฝั่งขวา)' },
        { left: 'รายการที่ 2 ฝั่งซ้าย', right: 'คำตอบ ข (ฝั่งขวา)' },
        { left: 'รายการที่ 3 ฝั่งซ้าย', right: 'คำตอบ ค (ฝั่งขวา)' },
        { left: 'รายการที่ 4 ฝั่งซ้าย', right: 'คำตอบ ง (ฝั่งขวา)' },
      ],
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (index: number, updated: Question) => {
    const newQs = [...questions];
    newQs[index] = updated;
    setQuestions(newQs);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const lastFocusedInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        lastFocusedInputRef.current = target as HTMLInputElement | HTMLTextAreaElement;
      }
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  const handleInsertSymbol = (symbol: string) => {
    const target =
      lastFocusedInputRef.current ||
      (document.activeElement as HTMLInputElement | HTMLTextAreaElement | null);

    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? target.value.length;
      const val = target.value;
      const newVal = val.substring(0, start) + symbol + val.substring(end);

      const nativeSetter =
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;

      if (nativeSetter) {
        nativeSetter.call(target, newVal);
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.focus();
        setTimeout(() => {
          target.setSelectionRange(start + symbol.length, start + symbol.length);
        }, 0);
      }
    }
    try {
      navigator.clipboard.writeText(symbol);
    } catch {
      // Ignore clipboard error
    }
  };

  const handleGenerateExamVersions = () => {
    buildExamVersions(questions);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportDocx = async (withAnswerKey = showTeacherKeyOnPaper) => {
    try {
      const currentVer =
        generatedVersions.find((v) => v.versionCode === activePreviewVersion) || generatedVersions[0];

      const rawQs = currentVer
        ? currentVer.questions.map((vq) => ({
            text: vq.text,
            section: vq.section,
            type: vq.type,
            options: vq.options.map((o) => o.text),
            answerIndex: vq.correctOptionIndex,
            correctAnswerText: vq.correctAnswerText,
            codeSnippet: vq.codeSnippet,
            subItems: vq.subItems,
          }))
        : questions.map((q) => ({
            text: q.text,
            section: q.section,
            type: q.type,
            options: q.options,
            answerIndex: q.answerIndex,
            correctAnswerText: q.correctAnswerText,
            codeSnippet: q.codeSnippet,
            subItems: q.subItems,
          }));

      const sectionBuckets: Record<number, typeof rawQs> = {};
      rawQs.forEach((q) => {
        const secNum =
          q.section ||
          (q.type === 'coding_output' || q.type === 'fill_blank' || q.type === 'matching'
            ? 2
            : q.type === 'essay'
            ? 3
            : 1);
        if (!sectionBuckets[secNum]) sectionBuckets[secNum] = [];
        sectionBuckets[secNum].push(q);
      });

      const sections: WorksheetSection[] = Object.keys(sectionBuckets)
        .map(Number)
        .sort((a, b) => a - b)
        .map((secNum) => {
          const title =
            secNum === 1 ? mcTitle : secNum === 2 ? fillTitle : secNum === 3 ? essayTitle : matchingTitle;
          const instructions =
            secNum === 1
              ? mcInstruction
              : secNum === 2
              ? fillInstruction
              : secNum === 3
              ? essayInstruction
              : matchingInstruction;

          return {
            title,
            instructions,
            questions: sectionBuckets[secNum].map((q, idx) => {
              const isMC = !q.type || q.type === 'multiple_choice';
              const mcText = isMC
                ? `${q.text}\n${(q.options || [])
                    .map((opt, oIdx) => `   ${CHOICE_LABELS[oIdx] || oIdx + 1}. ${opt}`)
                    .join('\n')}`
                : q.text;

              return {
                number: idx + 1,
                question: mcText,
                codeSnippet: q.codeSnippet,
                subItems: q.subItems?.map((s, sIdx) => ({
                  id: `sub-${idx}-${sIdx}`,
                  label: s.label,
                  answer: s.answer,
                })),
                spaceType:
                  q.type === 'essay'
                    ? ('lines' as const)
                    : q.type === 'fill_blank'
                    ? ('lines' as const)
                    : ('blank' as const),
                linesCount: q.type === 'essay' ? 4 : q.type === 'fill_blank' ? 2 : 0,
                score: q.subItems?.length ? q.subItems.length : 1,
                answerKey: isMC
                  ? `${CHOICE_LABELS[q.answerIndex] || 'ก'}`
                  : q.correctAnswerText || '',
              };
            }),
          };
        });

      const ws: Worksheet = {
        id: `ws-export-${Date.now()}`,
        title: `${examTitle}${currentVer ? ` (ชุด ${currentVer.versionCode})` : ''}`,
        subject: subjectName,
        gradeLevel: '',
        schoolName,
        teacherName,
        worksheetType: 'worksheet',
        totalScore: rawQs.length,
        timeMinutes: 60,
        sections,
        createdAt: new Date().toISOString(),
      };

      const blob = await generateWorksheetDocx(ws, withAnswerKey);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (examTitle || 'ใบงาน_ข้อสอบ').replace(/[\\/:*?"<>|]/g, '_');
      a.download = `${safeName}${currentVer ? `_ชุด_${currentVer.versionCode}` : ''}${
        withAnswerKey ? '_เฉลยครู' : ''
      }.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export DOCX error:', err);
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Word (.docx)');
    }
  };

  const handleCopyMasterKey = () => {
    let keyText = `=== ตารางเฉลยข้อสอบรวม (${schoolName}) ===\nวิชา: ${subjectName} | ${examTitle}\n\n`;
    questions.forEach((q, origIdx) => {
      keyText += `ข้อ ${origIdx + 1}: ${q.text}\n`;
      generatedVersions.forEach((v) => {
        const qInVersion = v.questions.find((item) => item.questionIndexOriginal === origIdx);
        if (qInVersion) {
          const versionQNum = v.questions.indexOf(qInVersion) + 1;
          const choiceStr = CHOICE_LABELS[qInVersion.correctOptionIndex];
          keyText += `   • ชุด ${v.versionCode} (ข้อ ${versionQNum}): ตอบ ${choiceStr}.\n`;
        }
      });
      keyText += `\n`;
    });

    try {
      navigator.clipboard.writeText(keyText);
      setCopiedKeySuccess(true);
      setTimeout(() => setCopiedKeySuccess(false), 2500);
    } catch {
      alert('ไม่สามารถคัดลอกข้อความได้');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-12">
      <Header
        title="สลับข้อสอบ A-B-C"
        subtitle="สุ่มลำดับข้อสอบ สุ่มสลับตัวเลือกคำตอบ พร้อมสร้างเฉลยอัตโนมัติ"
      />

      <div className="p-8 max-w-5xl mx-auto w-full space-y-6 print:p-0 print:m-0 print:max-w-none print:w-full print:space-y-0">
            {/* Header Settings Bar */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 print:hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" /> ข้อมูลหัวกระดาษและคำชี้แจง
                </h3>
              </div>

              {/* Logo Upload & School Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">โลโก้โรงเรียน / ตราสัญลักษณ์</label>
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full px-3 py-2 border-2 border-dashed border-slate-300 rounded-xl text-xs font-medium text-slate-600 hover:border-brand-500 hover:text-brand-600 flex items-center justify-center gap-2 transition bg-slate-50"
                  >
                    {logoUrl ? (
                      <div className="flex items-center gap-2">
                        <img src={logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
                        <span className="truncate max-w-[120px]">เปลี่ยนภาพโลโก้</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                        <span>อัปโหลดภาพโลโก้ (PNG / JPG)</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อโรงเรียน / สถาบัน</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="โรงเรียนสาธิตการศึกษา"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หัวเรื่องแบบทดสอบ / การสอบ</label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="แบบทดสอบวัดผลสัมฤทธิ์ทางการเรียน"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Subject, Teacher, Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อวิชา / รหัสวิชา</label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="วิชา วิทยาศาสตร์และเทคโนโลยี (ว21101)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ครูผู้สอน</label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="ครูผู้สอน: ครูสมชาย"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เวลาในการทำ</label>
                  <input
                    type="text"
                    value={examTime}
                    onChange={(e) => setExamTime(e.target.value)}
                    placeholder="เวลาในการทำ: 60 นาที"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Multi-line Instruction Text area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำชี้แจง / คำสั่ง (สามารถใส่แยกบรรทัดเป็นข้อๆ ได้)
                </label>
                <textarea
                  rows={3}
                  value={instructionText}
                  onChange={(e) => setInstructionText(e.target.value)}
                  placeholder={`1. ให้ทำเครื่องหมายกากบาท (X) หรือฝนทับตัวเลือกที่ถูกต้องเพียงข้อเดียว\n2. ข้อสอบมีทั้งหมด 10 ข้อ คะแนนเต็ม 10 คะแนน\n3. ห้ามขีดเขียนข้อความใดๆ นอกเหนือจากตำแหน่งที่กำหนดไว้`}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Section Titles & Instructions per Question Type */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowSectionConfig(!showSectionConfig)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-800 hover:text-brand-600 transition"
                >
                  <span className="flex items-center gap-2">
                    🏷️ ตั้งค่าชื่อตอน & คำชี้แจงแยกตามประเภทข้อสอบ (ปรนัย / จับคู่ / เติมคำ / อัตนัย)
                  </span>
                  {showSectionConfig ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {showSectionConfig && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-xs font-extrabold text-slate-900 block">1. ข้อสอบแบบปรนัย (Multiple Choice)</span>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">ชื่อหัวตอน</label>
                        <input
                          type="text"
                          value={mcTitle}
                          onChange={(e) => setMcTitle(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">คำชี้แจงประจำตอน</label>
                        <input
                          type="text"
                          value={mcInstruction}
                          onChange={(e) => setMcInstruction(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-xs font-extrabold text-slate-900 block">2. ข้อสอบแบบจับคู่ (Matching)</span>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">ชื่อหัวตอน</label>
                        <input
                          type="text"
                          value={matchingTitle}
                          onChange={(e) => setMatchingTitle(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">คำชี้แจงประจำตอน</label>
                        <input
                          type="text"
                          value={matchingInstruction}
                          onChange={(e) => setMatchingInstruction(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-xs font-extrabold text-slate-900 block">3. ข้อสอบแบบเติมคำตอบ (Fill-in-blank)</span>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">ชื่อหัวตอน</label>
                        <input
                          type="text"
                          value={fillTitle}
                          onChange={(e) => setFillTitle(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">คำชี้แจงประจำตอน</label>
                        <input
                          type="text"
                          value={fillInstruction}
                          onChange={(e) => setFillInstruction(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-xs font-extrabold text-slate-900 block">4. ข้อสอบแบบอัตนัย (Essay)</span>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">ชื่อหัวตอน</label>
                        <input
                          type="text"
                          value={essayTitle}
                          onChange={(e) => setEssayTitle(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">คำชี้แจงประจำตอน</label>
                        <input
                          type="text"
                          value={essayInstruction}
                          onChange={(e) => setEssayInstruction(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">จำนวนชุดข้อสอบ</label>
                    <select
                      value={versionCount}
                      onChange={(e) => setVersionCount(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                    >
                      <option value={2}>2 ชุด (A, B)</option>
                      <option value={3}>3 ชุด (A, B, C)</option>
                      <option value={4}>4 ชุด (A, B, C, D)</option>
                      <option value={5}>5 ชุด (A, B, C, D, E)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">การจัดวางตัวเลือก</label>
                    <select
                      value={choiceLayout}
                      onChange={(e) => setChoiceLayout(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                    >
                      <option value="auto">⚡ อัตโนมัติ (ตามความยาวข้อความ)</option>
                      <option value="1">1 คอลัมน์ (ก. ข. ค. ง. เรียงลงมา)</option>
                      <option value="2">2 คอลัมน์ (ก-ข / ค-ง)</option>
                      <option value="4">4 คอลัมน์ (ก-ข-ค-ง แนวนอน)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">รูปแบบฟอนต์</label>
                    <select
                      value={fontFamily}
                      onChange={(e: any) => setFontFamily(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                    >
                      <option value="Sarabun">Sarabun (สารบัญ)</option>
                      <option value="Prompt">Prompt (พรอพมท์)</option>
                      <option value="Kanit">Kanit (คณิต)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ขนาดตัวอักษร</label>
                    <select
                      value={fontSize}
                      onChange={(e: any) => setFontSize(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                    >
                      <option value="small">เล็ก (Small)</option>
                      <option value="medium">ปานกลาง (Medium)</option>
                      <option value="large">ใหญ่ (Large)</option>
                      <option value="xlarge">ใหญ่พิเศษ (X-Large)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">คอลัมน์กระดาษข้อสอบ</label>
                    <select
                      value={paperColumns}
                      onChange={(e: any) => setPaperColumns(Number(e.target.value) as 1 | 2)}
                      className="px-3 py-1.5 rounded-xl border border-brand-300 text-xs font-bold bg-brand-50 text-brand-900"
                    >
                      <option value={2}>📄 2 คอลัมน์ (ประหยัดกระดาษสูงสุด ⭐)</option>
                      <option value={1}>📄 1 คอลัมน์ (เรียงยาวมาตรฐาน)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ระยะห่าง/ขนาดช่องข้อสอบ</label>
                    <select
                      value={paperSpacing}
                      onChange={(e: any) => setPaperSpacing(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                    >
                      <option value="compact">กระชับ (Compact - ประหยัดกระดาษ)</option>
                      <option value="normal">ปานกลาง (Normal - มาตรฐาน)</option>
                      <option value="spacious">กว้างพิเศษ (Spacious - มีที่ทดเลข)</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-4">
                    <input
                      type="checkbox"
                      checked={shuffleQ}
                      onChange={(e) => setShuffleQ(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-xs font-medium text-slate-700">สลับลำดับข้อ</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer pt-4">
                    <input
                      type="checkbox"
                      checked={shuffleOpt}
                      onChange={(e) => setShuffleOpt(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-xs font-medium text-slate-700">สลับตัวเลือกคำตอบ</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/worksheets"
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold py-2.5 px-4 rounded-xl text-xs border border-indigo-200 shadow-2xs flex items-center gap-1.5 transition"
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    📝 จัดรูปแบบใบงาน (DOCX / PDF)
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleExportDocx(showTeacherKeyOnPaper)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    📥 ดาวน์โหลด Word (.docx)
                  </button>

                  <button
                    onClick={() => {
                      setBankTitleInput(examTitle);
                      setBankSubjectInput(subjectName);
                      setSaveBankModalOpen(true);
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-2.5 px-4 rounded-xl text-xs border border-emerald-200 shadow-2xs flex items-center gap-1.5 transition"
                  >
                    <Save className="w-4 h-4 text-emerald-600" />
                    💾 บันทึกลงคลังข้อสอบ
                  </button>

                  <button
                    onClick={handleGenerateExamVersions}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-xs flex items-center gap-2 transition"
                  >
                    <Shuffle className="w-4 h-4" />
                    สลับข้อสอบและสร้างชุด A-B-C
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs max-w-2xl print:hidden">
              <button
                onClick={() => setActiveTab('paste')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'paste'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ✨ วางข้อความ / สกัดข้อสอบ
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'edit'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📝 จัดการข้อสอบ & เฉลย ({questions.length} ข้อ)
              </button>
              <button
                onClick={() => setActiveTab('bank')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'bank'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📚 คลังข้อสอบ ({examBankList.length})
              </button>
              {generatedVersions.length > 0 && (
                <button
                  onClick={() => setActiveTab('results')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === 'results'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📋 ผลลัพธ์กระดาษข้อสอบ (ชุด A-B-C)
                </button>
              )}
            </div>

            {/* TAB: Paste & Image OCR */}
            {activeTab === 'paste' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 print:hidden">
                <input
                  type="file"
                  ref={examImageInputRef}
                  onChange={handleExamImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-600" /> ป้อนหรือวางข้อความข้อสอบ (รองรับปรนัย ก-ง และโจทย์โค้ดโปรแกรม/อาร์เรย์)
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRawText(
                          `เติมผลลัพธ์จากการเข้าถึงข้อมูล (5 คะแนน)\nกำหนดโค้ดดังนี้\ntemperature = [28, 31, 29, 33, 35, 30]print(temperature[0])print(temperature[3])print(temperature[5])\n\nจงเติมผลลัพธ์ที่ได้จากการทำงานของโปรแกรม\n1. temperature[0] = ....................\n2. temperature[3] = ....................\n3. temperature[5] = ....................\nกำหนดอาร์เรย์ 2 มิติดังนี้\ndata = [    [12, 15, 18],    [21, 24, 27],    [30, 33, 36]]print(data[2][1])print(data[0][2])\n\n4. data[2][1] = ....................\n5. data[0][2] = ....................`
                        );
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition"
                    >
                      💻 โหลดตัวอย่างโจทย์โค้ด (Array 1D/2D)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleAddQuestion('coding_output');
                        setActiveTab('edit');
                      }}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-1.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-200 shadow-2xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> สร้างโจทย์โค้ด/เติมผลลัพธ์ย่อย
                    </button>

                    <button
                      type="button"
                      onClick={() => examImageInputRef.current?.click()}
                      disabled={isOcrScanning}
                      className="bg-white hover:bg-slate-100 text-purpleBrand-700 font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-2 border border-purpleBrand-200 shadow-2xs transition"
                    >
                      {isOcrScanning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-purpleBrand-600" />
                          กำลังสแกนอ่านภาพข้อสอบ (OCR)...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 text-purpleBrand-600" />
                          📷 ถ่ายภาพ / อัปโหลดรูปข้อสอบ (OCR)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <textarea
                  rows={10}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`พิมพ์หรือวางข้อความข้อสอบที่นี่ (หรือกดปุ่มถ่ายภาพ/อัปโหลดรูปข้อสอบด้านบน):\n\n1. ข้อใดคือดาวเคราะห์ที่อยู่ใกล้ดวงอาทิตย์มากที่สุด\nก. ดาวพุธ\nข. ดาวศุกร์\nค. โลก\nง. ดาวอังคาร\nเฉลย: ก\n\n2. ...`}
                  className="w-full p-4 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white font-mono"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleParseText}
                    disabled={isParsing || isOcrScanning || !rawText.trim()}
                    className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> กำลังประมวลผลข้อสอบ...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> ✨ แปลงเป็นฟอร์มข้อสอบ & ออกเป็นชุด A-B-C ทันที
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Edit Questions & Answer Keys */}
            {activeTab === 'edit' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6 print:hidden">
                {activeBankId && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-amber-950">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-xs font-extrabold">✏️ กำลังแก้ไขข้อสอบในคลัง: "{bankTitleInput || examTitle}"</p>
                        <p className="text-[11px] text-amber-800">การแก้ไขข้อสอบ ตัวเลือก หรือรูปภาพที่นี่ สามารถกดอัปเดตกลับลงคลังข้อสอบเดิมได้ทันที</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveToBank}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
                      >
                        <Save className="w-4 h-4" /> 💾 อัปเดตชุดข้อสอบในคลัง
                      </button>
                      <button
                        onClick={() => setActiveBankId(null)}
                        className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs border border-slate-200 transition"
                      >
                        ✖ ยกเลิกโหมดแก้ไขคลัง
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-600" /> รายการข้อสอบและระบุเฉลยคำตอบที่ถูกต้อง
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      เลือกรูปแบบข้อสอบ (ปรนัย/เติมคำ/อัตนัย), แนบรูปภาพโจทย์ และระบุเฉลยเพื่อให้ระบบสลับข้อสอบและกระดาษคำตอบให้อัตโนมัติ
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700 mr-1">➕ เพิ่มข้อสอบแยกตามตอน:</span>
                    <button
                      onClick={() => handleAddQuestion('multiple_choice', 1)}
                      className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> 📌 เพิ่มข้อใน "ตอนที่ 1" (ปรนัย ก-ง)
                    </button>
                    <button
                      onClick={() => handleAddQuestion('coding_output', 2)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> 📌 เพิ่ม "ตอนที่ 2" (โจทย์โค้ด / เติมผลลัพธ์)
                    </button>
                    <button
                      onClick={() => handleAddQuestion('fill_blank', 2)}
                      className="bg-purpleBrand-600 hover:bg-purpleBrand-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> 📌 เพิ่ม "ตอนที่ 2" (เติมคำตอบสั้น)
                    </button>
                    <button
                      onClick={() => handleAddQuestion('essay', 3)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> 📌 เพิ่ม "ตอนที่ 3" (อัตนัย / แสดงวิธีทำ)
                    </button>
                    <button
                      onClick={() => handleAddQuestion('matching', 4)}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> 📌 เพิ่ม "ตอนที่ 4" (จับคู่)
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const qSec =
                      q.section ||
                      (q.type === 'coding_output' || q.type === 'fill_blank' || q.type === 'matching'
                        ? 2
                        : q.type === 'essay'
                        ? 3
                        : 1);
                    const prevQ = idx > 0 ? questions[idx - 1] : null;
                    const prevSec = prevQ
                      ? prevQ.section ||
                        (prevQ.type === 'coding_output' || prevQ.type === 'fill_blank' || prevQ.type === 'matching'
                          ? 2
                          : prevQ.type === 'essay'
                          ? 3
                          : 1)
                      : null;
                    const isFirstInSec = idx === 0 || qSec !== prevSec;
                    const nextQ = idx < questions.length - 1 ? questions[idx + 1] : null;
                    const nextSec = nextQ
                      ? nextQ.section ||
                        (nextQ.type === 'coding_output' || nextQ.type === 'fill_blank' || nextQ.type === 'matching'
                          ? 2
                          : nextQ.type === 'essay'
                          ? 3
                          : 1)
                      : null;
                    const isLastInSec = idx === questions.length - 1 || qSec !== nextSec;

                    let secBannerTitle = mcTitle;
                    let secBannerInst = mcInstruction;
                    if (qSec === 2) {
                      secBannerTitle = fillTitle;
                      secBannerInst = fillInstruction;
                    } else if (qSec === 3) {
                      secBannerTitle = essayTitle;
                      secBannerInst = essayInstruction;
                    } else if (qSec === 4) {
                      secBannerTitle = matchingTitle;
                      secBannerInst = matchingInstruction;
                    }

                    return (
                      <div key={q.id} className="space-y-3">
                        {/* Section Header Divider (Shown ONLY ONCE when a new section starts!) */}
                        {isFirstInSec && (
                          <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-white shadow-sm flex flex-wrap items-center justify-between gap-3">
                            <div className="flex-1 min-w-[240px] space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-brand-500 text-white text-[11px] font-extrabold">
                                  📌 ตอนที่ {qSec}
                                </span>
                                <input
                                  type="text"
                                  value={secBannerTitle}
                                  onChange={(e) => {
                                    if (qSec === 2) setFillTitle(e.target.value);
                                    else if (qSec === 3) setEssayTitle(e.target.value);
                                    else if (qSec === 4) setMatchingTitle(e.target.value);
                                    else setMcTitle(e.target.value);
                                  }}
                                  className="flex-1 bg-white/10 hover:bg-white/15 focus:bg-white focus:text-slate-900 px-2.5 py-1 rounded-lg text-xs font-extrabold text-white focus:outline-none transition"
                                  placeholder={`ชื่อหัวข้อตอนที่ ${qSec}...`}
                                />
                              </div>
                              <input
                                type="text"
                                value={secBannerInst}
                                onChange={(e) => {
                                  if (qSec === 2) setFillInstruction(e.target.value);
                                  else if (qSec === 3) setEssayInstruction(e.target.value);
                                  else if (qSec === 4) setMatchingInstruction(e.target.value);
                                  else setMcInstruction(e.target.value);
                                }}
                                className="w-full bg-transparent hover:bg-white/10 focus:bg-white focus:text-slate-900 px-2.5 py-0.5 rounded-lg text-[11px] text-slate-300 focus:outline-none transition"
                                placeholder="คำชี้แจงประจำตอน..."
                              />
                            </div>
                          </div>
                        )}

                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
                              <span className="font-bold text-xs text-slate-800 bg-slate-200 px-2.5 py-1.5 rounded-lg flex-shrink-0">
                                ข้อ {idx + 1}
                              </span>

                              <select
                                value={q.type || 'multiple_choice'}
                                onChange={(e) => {
                                  const newType = e.target.value as
                                    | 'multiple_choice'
                                    | 'fill_blank'
                                    | 'essay'
                                    | 'matching'
                                    | 'coding_output';
                                  handleUpdateQuestion(idx, {
                                    ...q,
                                    type: newType,
                                  });
                                }}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500"
                              >
                                <option value="multiple_choice">📝 ปรนัย (ตัวเลือก ก-ง)</option>
                                <option value="fill_blank">✏️ เติมคำ / ตอบสั้น</option>
                                <option value="coding_output">💻 โจทย์โค้ด / เติมผลลัพธ์ย่อย</option>
                                <option value="essay">📄 อัตนัย / เขียนบรรยาย</option>
                                <option value="matching">🔗 จับคู่ (Matching)</option>
                              </select>

                          <input
                            type="text"
                            value={q.text}
                            onChange={(e) =>
                              handleUpdateQuestion(idx, { ...q, text: e.target.value })
                            }
                            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none min-w-[200px]"
                            placeholder="โจทย์คำถาม..."
                          />
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            id={`q-img-input-${idx}`}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  handleUpdateQuestion(idx, {
                                    ...q,
                                    imageUrl: ev.target?.result as string,
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById(`q-img-input-${idx}`)?.click()}
                            className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1 transition shadow-2xs"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                            {q.imageUrl ? 'เปลี่ยนรูปโจทย์' : '📷 แนบรูปโจทย์'}
                          </button>
                          {q.imageUrl && (
                            <button
                              type="button"
                              onClick={() => handleUpdateQuestion(idx, { ...q, imageUrl: null })}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                              title="ลบรูปภาพโจทย์"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleRemoveQuestion(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                            title="ลบข้อสอบข้อนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Image Thumbnail Preview in Editor */}
                      {q.imageUrl && (
                        <div className="pl-2 pt-1">
                          <img
                            src={q.imageUrl}
                            alt={`โจทย์ข้อ ${idx + 1}`}
                            className="max-h-40 rounded-xl border border-slate-200 object-contain bg-white p-1"
                          />
                        </div>
                      )}

                      {/* Question Answer / Options Editor according to Question Type */}
                      {(!q.type || q.type === 'multiple_choice') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-2">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border transition ${
                                q.answerIndex === oIdx
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-2xs'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                                <input
                                  type="radio"
                                  name={`ans-${q.id}`}
                                  checked={q.answerIndex === oIdx}
                                  onChange={() =>
                                    handleUpdateQuestion(idx, { ...q, answerIndex: oIdx })
                                  }
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span className="font-bold text-xs">{CHOICE_LABELS[oIdx]}.</span>
                              </label>
                              <input
                                type="text"
                                value={cleanOptionText(opt)}
                                onChange={(e) => {
                                  const newOpts = [...q.options];
                                  newOpts[oIdx] = e.target.value;
                                  handleUpdateQuestion(idx, { ...q, options: newOpts });
                                }}
                                className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                                placeholder={`ตัวเลือก ${CHOICE_LABELS[oIdx]}`}
                              />
                              {q.answerIndex === oIdx && (
                                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md flex-shrink-0">
                                  เฉลยถูก
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'fill_blank' && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            🔑 เฉลยคำตอบเติมคำ / ตอบสั้น (คำตอบที่ถูกต้อง):
                          </label>
                          <input
                            type="text"
                            value={q.correctAnswerText || ''}
                            onChange={(e) =>
                              handleUpdateQuestion(idx, { ...q, correctAnswerText: e.target.value })
                            }
                            placeholder="พิมพ์คำตอบที่ถูกต้องสำหรับเฉลยในกระดาษคำตอบ..."
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-emerald-900 bg-emerald-50/30"
                          />
                        </div>
                      )}

                      {q.type === 'essay' && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            🔑 แนวทางการตอบ / เกณฑ์การตรวจให้คะแนนข้อสอบอัตนัย:
                          </label>
                          <textarea
                            rows={2}
                            value={q.correctAnswerText || ''}
                            onChange={(e) =>
                              handleUpdateQuestion(idx, { ...q, correctAnswerText: e.target.value })
                            }
                            placeholder="พิมพ์เกณฑ์เฉลยการตอบ หรือแนวทางการแสดงวิธีทำ..."
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-emerald-900 bg-emerald-50/30"
                          />
                        </div>
                      )}

                      {q.type === 'matching' && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              🔗 รายการจับคู่ข้อความ (ฝั่งซ้าย ➔ เฉลยคำตอบฝั่งขวา):
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentPairs = q.matchingPairs || [];
                                const nextIdx = currentPairs.length + 1;
                                const newPairs = [
                                  ...currentPairs,
                                  {
                                    left: `รายการที่ ${nextIdx} (ฝั่งซ้าย)`,
                                    right: `คำตอบ ${CHOICE_LABELS[nextIdx - 1] || nextIdx} (ฝั่งขวา)`,
                                  },
                                ];
                                handleUpdateQuestion(idx, { ...q, matchingPairs: newPairs });
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg transition border border-brand-200"
                            >
                              + เพิ่มคู่ข้อความ
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(q.matchingPairs || []).map((pair, pIdx) => (
                              <div key={pIdx} className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 w-5">{pIdx + 1}.</span>
                                <input
                                  type="text"
                                  value={pair.left}
                                  onChange={(e) => {
                                    const newPairs = [...(q.matchingPairs || [])];
                                    newPairs[pIdx] = { ...newPairs[pIdx], left: e.target.value };
                                    handleUpdateQuestion(idx, { ...q, matchingPairs: newPairs });
                                  }}
                                  placeholder={`รายการข้อ ${pIdx + 1} (ฝั่งซ้าย)`}
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
                                />
                                <span className="text-xs font-bold text-slate-400">➔ {CHOICE_LABELS[pIdx] || pIdx + 1}.</span>
                                <input
                                  type="text"
                                  value={pair.right}
                                  onChange={(e) => {
                                    const newPairs = [...(q.matchingPairs || [])];
                                    newPairs[pIdx] = { ...newPairs[pIdx], right: e.target.value };
                                    handleUpdateQuestion(idx, { ...q, matchingPairs: newPairs });
                                  }}
                                  placeholder={`เฉลยคำตอบ ${CHOICE_LABELS[pIdx] || pIdx + 1} (ฝั่งขวา)`}
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-300 text-xs font-semibold bg-emerald-50/20 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                                {(q.matchingPairs || []).length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newPairs = (q.matchingPairs || []).filter((_, i) => i !== pIdx);
                                      handleUpdateQuestion(idx, { ...q, matchingPairs: newPairs });
                                    }}
                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.type === 'coding_output' && (
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
                          <div>
                            <label className="text-xs font-bold text-slate-800 block mb-1">
                              💻 โค้ดโปรแกรม (Code Snippet / Array):
                            </label>
                            <textarea
                              rows={5}
                              value={q.codeSnippet || ''}
                              onChange={(e) =>
                                handleUpdateQuestion(idx, { ...q, codeSnippet: e.target.value })
                              }
                              placeholder={`temperature = [28, 31, 29, 33, 35, 30]\nprint(temperature[0])\nprint(temperature[3])`}
                              className="w-full p-3 rounded-xl border border-slate-300 bg-slate-900 text-emerald-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                              <span className="text-xs font-bold text-slate-800">
                                🔢 รายการข้อย่อยที่ต้องการให้เติมผลลัพธ์ (Sub-questions & เฉลย):
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentSub = q.subItems || [];
                                  const nextNum = currentSub.length;
                                  handleUpdateQuestion(idx, {
                                    ...q,
                                    subItems: [
                                      ...currentSub,
                                      { label: `data[${nextNum}]`, answer: '' },
                                    ],
                                  });
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition border border-emerald-200"
                              >
                                + เพิ่มข้อย่อย
                              </button>
                            </div>

                            <div className="space-y-2">
                              {(q.subItems || []).map((sub, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-500 w-5">{sIdx + 1}.</span>
                                  <input
                                    type="text"
                                    value={sub.label}
                                    onChange={(e) => {
                                      const newSub = [...(q.subItems || [])];
                                      newSub[sIdx] = { ...newSub[sIdx], label: e.target.value };
                                      handleUpdateQuestion(idx, { ...q, subItems: newSub });
                                    }}
                                    placeholder="เช่น temperature[0]"
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
                                  />
                                  <span className="text-xs font-bold text-slate-500">=</span>
                                  <input
                                    type="text"
                                    value={sub.answer}
                                    onChange={(e) => {
                                      const newSub = [...(q.subItems || [])];
                                      newSub[sIdx] = { ...newSub[sIdx], answer: e.target.value };
                                      handleUpdateQuestion(idx, {
                                        ...q,
                                        subItems: newSub,
                                        correctAnswerText: newSub.map((s, i) => `${i + 1}) ${s.label} = ${s.answer}`).join(', '),
                                      });
                                    }}
                                    placeholder="เฉลยผลลัพธ์ เช่น 28"
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-300 text-xs font-mono font-bold bg-emerald-50/30 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                  {(q.subItems || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newSub = (q.subItems || []).filter((_, i) => i !== sIdx);
                                        handleUpdateQuestion(idx, { ...q, subItems: newSub });
                                      }}
                                      className="p-1 text-rose-500 hover:bg-rose-50 rounded transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                        </div>

                        {/* Action Bar at the end of each Section: Continue current section OR Start next section */}
                        {isLastInSec && (
                          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100/80 border border-dashed border-slate-300">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleAddQuestion(q.type || 'multiple_choice', qSec as 1 | 2 | 3 | 4)}
                                className="bg-white hover:bg-slate-50 text-slate-800 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-slate-300 shadow-2xs transition"
                              >
                                <Plus className="w-3.5 h-3.5 text-brand-600" /> เพิ่มข้อต่อไปใน ตอนที่ {qSec} (ไม่ต้องใส่ตอนซ้ำ)
                              </button>
                            </div>

                            {qSec < 4 && (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAddQuestion(
                                      qSec === 1 ? 'coding_output' : qSec === 2 ? 'essay' : 'matching',
                                      (qSec + 1) as 2 | 3 | 4
                                    )
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition"
                                >
                                  <Plus className="w-3.5 h-3.5" /> 📌 เริ่ม "ตอนที่ {qSec + 1}" ใหม่ตรงนี้
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAddQuestion('multiple_choice')}
                      className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 border border-slate-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> เพิ่มข้อสอบปรนัย
                    </button>
                    <button
                      onClick={() => handleAddQuestion('fill_blank')}
                      className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 border border-slate-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> เพิ่มข้อสอบเติมคำ
                    </button>
                    <button
                      onClick={() => handleAddQuestion('essay')}
                      className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 border border-slate-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> เพิ่มข้อสอบอัตนัย
                    </button>
                    <button
                      onClick={() => handleAddQuestion('matching')}
                      className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 border border-slate-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> เพิ่มข้อสอบจับคู่
                    </button>
                    <button
                      onClick={() => handleAddQuestion('coding_output')}
                      className="bg-white hover:bg-slate-50 text-emerald-800 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 border border-emerald-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> 💻 เพิ่มโจทย์โค้ด/เติมผลลัพธ์
                    </button>
                  </div>

                  <button
                    onClick={() => buildExamVersions(questions)}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                  >
                    <Shuffle className="w-4 h-4" /> ✨ บันทึกเฉลย & สลับสร้างชุดข้อสอบ/กระดาษคำตอบ A-B-C
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Exam Bank */}
            {activeTab === 'bank' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6 print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-brand-600" /> คลังข้อสอบทั้งหมดในระบบ ({examBankList.length} ชุด)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      เลือกข้อสอบจากคลังเพื่อดึงมาสลับข้อสอบ ออกชุด A-B-C หรือแก้ไขและพิมพ์ใหม่ได้ทันที
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="ค้นหาข้อสอบในคลัง..."
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setBankTitleInput(examTitle);
                        setBankSubjectInput(subjectName);
                        setSaveBankModalOpen(true);
                      }}
                      className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Save className="w-4 h-4" /> บันทึกข้อสอบชุดนี้ลงคลัง
                    </button>
                  </div>
                </div>

                {examBankList.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <Archive className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">ยังไม่มีข้อสอบในคลัง</p>
                    <p className="text-xs text-slate-500">
                      คุณสามารถสร้างข้อสอบ และกดปุ่ม "💾 บันทึกลงคลังข้อสอบ" เพื่อเก็บข้อสอบไว้ใช้งานซ้ำได้เสมอ
                    </p>
                    <button
                      onClick={() => {
                        setBankTitleInput(examTitle);
                        setBankSubjectInput(subjectName);
                        setSaveBankModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition"
                    >
                      <Save className="w-4 h-4" /> บันทึกชุดปัจจุบันลงคลัง
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {examBankList
                      .filter(
                        (item) =>
                          item.title.toLowerCase().includes(bankSearch.toLowerCase()) ||
                          item.subject.toLowerCase().includes(bankSearch.toLowerCase())
                      )
                      .map((item) => (
                        <div
                          key={item.id}
                          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover-card space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] bg-brand-50 text-brand-700 font-bold px-2.5 py-0.5 rounded-full border border-brand-100">
                                {item.subject}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(item.createdAt).toLocaleDateString('th-TH')}
                              </span>
                            </div>

                            <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {item.headerConfig?.subjectName || item.subject} • {item.questionsCount} ข้อสอบ
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                onClick={() => handleLoadFromBank(item)}
                                className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-2xs transition"
                              >
                                <FolderDown className="w-3.5 h-3.5" /> ⚡ ดึงมาใช้งาน / สลับ A-B-C
                              </button>
                              <button
                                onClick={() => handleOpenEditBankModal(item)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition"
                                title="แก้ไขหัวข้อสอบ/ข้อมูลทั่วไป"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-brand-600" /> ✏️ แก้ไขหัวข้อ
                              </button>
                              <button
                                onClick={() => handleEditBankQuestionsInEditor(item)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 border border-amber-200 transition"
                                title="ดึงข้อสอบเพื่อแก้ไขตัวโจทย์ใน Editor"
                              >
                                <FileEdit className="w-3.5 h-3.5 text-amber-600" /> 📝 แก้ไขโจทย์
                              </button>
                            </div>

                            <button
                              onClick={() => handleDeleteFromBank(item.id, item.title)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition"
                              title="ลบออกจากคลัง"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Generated Results (Exam Paper + Answer Sheet + Master Key) */}
            {activeTab === 'results' && generatedVersions.length > 0 && (
              <div className="space-y-6">
                {/* View Mode & Version Selector Bar */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 px-6 space-y-4 print:hidden">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    {/* View Mode Tabs */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setResultViewMode('paper')}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                          resultViewMode === 'paper'
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <FileText className="w-4 h-4" /> 📋 กระดาษข้อสอบ (Exam Paper)
                      </button>
                      <button
                        onClick={() => setResultViewMode('sheet')}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                          resultViewMode === 'sheet'
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <FileText className="w-4 h-4" /> 📄 กระดาษคำตอบ (Answer Sheet)
                      </button>
                      <button
                        onClick={() => setResultViewMode('key')}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                          resultViewMode === 'key'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" /> 🔑 ตารางเฉลยรวม (Master Key)
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {resultViewMode !== 'key' && (
                        <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition">
                          <input
                            type="checkbox"
                            checked={showTeacherKeyOnPaper}
                            onChange={(e) => setShowTeacherKeyOnPaper(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-emerald-900">
                            🔑 แสดงเฉลยคำตอบ (ฉบับครู)
                          </span>
                        </label>
                      )}

                      <button
                        type="button"
                        onClick={() => handleExportDocx(showTeacherKeyOnPaper)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> ดาวน์โหลด Word (.docx)
                      </button>

                      <button
                        onClick={handlePrint}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                      >
                        <Printer className="w-4 h-4" /> พิมพ์ / ส่งออก PDF
                      </button>
                    </div>
                  </div>

                  {/* Version Pills & Answer Sheet Options */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {resultViewMode !== 'key' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">เลือกชุดข้อสอบ:</span>
                        {generatedVersions.map((v) => (
                          <button
                            key={v.versionCode}
                            onClick={() => setActivePreviewVersion(v.versionCode)}
                            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
                              activePreviewVersion === v.versionCode
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            ชุด {v.versionCode}
                          </button>
                        ))}
                      </div>
                    )}

                    {resultViewMode === 'paper' && (
                      <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold">
                        <span className="text-slate-600 pl-2">รูปแบบหน้ากระดาษ:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPaperColumns(2);
                            setPaperSpacing('compact');
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                            paperColumns === 2
                              ? 'bg-brand-600 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          📰 2 คอลัมน์ (ประหยัดกระดาษสูงสุด)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaperColumns(1)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                            paperColumns === 1
                              ? 'bg-brand-600 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          📄 1 คอลัมน์
                        </button>

                        <span className="text-slate-300">|</span>

                        <button
                          type="button"
                          onClick={() => {
                            const newQ: Question = {
                              id: `q-sec2-${Date.now()}`,
                              type: 'coding_output',
                              text: 'เติมผลลัพธ์จากการเข้าถึงข้อมูล (5 คะแนน)',
                              codeSnippet: `# กำหนดโค้ดดังนี้\ntemperature = [28, 31, 29, 33, 35, 30]\nprint(temperature[0])\nprint(temperature[3])\nprint(temperature[5])\n\n# กำหนดอาร์เรย์ 2 มิติดังนี้\ndata = [\n    [12, 15, 18],\n    [21, 24, 27],\n    [30, 33, 36]\n]\nprint(data[2][1])\nprint(data[0][2])`,
                              subItems: [
                                { label: 'temperature[0]', answer: '28' },
                                { label: 'temperature[3]', answer: '33' },
                                { label: 'temperature[5]', answer: '30' },
                                { label: 'data[2][1]', answer: '33' },
                                { label: 'data[0][2]', answer: '18' },
                              ],
                              options: ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
                              answerIndex: 0,
                              correctAnswerText: '1) 28, 2) 33, 3) 30, 4) 33, 5) 18',
                            };
                            const updated = [...questions, newQ];
                            setQuestions(updated);
                            buildExamVersions(updated);
                          }}
                          className="px-3 py-1.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> ➕ เพิ่มตอนที่ 2 (โจทย์โค้ด/เติมผลลัพธ์)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const newQ: Question = {
                              id: `q-fill-${Date.now()}`,
                              type: 'fill_blank',
                              text: `จงเติมคำตอบที่ถูกต้องลงในช่องว่าง`,
                              options: ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
                              answerIndex: 0,
                              correctAnswerText: 'คำตอบที่ถูกต้อง',
                            };
                            const updated = [...questions, newQ];
                            setQuestions(updated);
                            buildExamVersions(updated);
                          }}
                          className="px-3 py-1.5 rounded-xl font-bold bg-purpleBrand-600 hover:bg-purpleBrand-700 text-white shadow-2xs transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> ➕ เพิ่มข้อเติมคำ
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const newQ: Question = {
                              id: `q-essay-${Date.now()}`,
                              type: 'essay',
                              text: `จงอธิบายและแสดงวิธีทำโดยละเอียด`,
                              options: ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
                              answerIndex: 0,
                              correctAnswerText: 'แนวทางการตอบ...',
                            };
                            const updated = [...questions, newQ];
                            setQuestions(updated);
                            buildExamVersions(updated);
                          }}
                          className="px-3 py-1.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> ➕ เพิ่มตอนอัตนัย
                        </button>
                      </div>
                    )}

                    {resultViewMode === 'sheet' && (
                      <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700">
                        <button
                          onClick={() => setShowTeacherKeyOnPaper(!showTeacherKeyOnPaper)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                            showTeacherKeyOnPaper
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          🔑 {showTeacherKeyOnPaper ? 'กำลังแสดงเฉลยบนกระดาษคำตอบ' : 'ทำเป็นกระดาษเฉลยครู (กากบาท/ฝนเต็มช่อง)'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <span>รูปแบบการตอบ:</span>
                          <button
                            onClick={() => setSheetMarkType('cross')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                              sheetMarkType === 'cross'
                                ? 'bg-white text-brand-700 shadow-2xs border border-slate-200'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            ✕ กากบาท
                          </button>
                          <button
                            onClick={() => setSheetMarkType('bubble')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                              sheetMarkType === 'bubble'
                                ? 'bg-white text-brand-700 shadow-2xs border border-slate-200'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            ● ฝนวงกลม
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span>ขนาดช่อง:</span>
                          <button
                            onClick={() => setSheetBoxSize('medium')}
                            className={`px-2 py-0.5 rounded ${sheetBoxSize === 'medium' ? 'bg-brand-600 text-white font-bold' : 'bg-white border'}`}
                          >
                            ปานกลาง
                          </button>
                          <button
                            onClick={() => setSheetBoxSize('large')}
                            className={`px-2 py-0.5 rounded ${sheetBoxSize === 'large' ? 'bg-brand-600 text-white font-bold' : 'bg-white border'}`}
                          >
                            ใหญ่ ⭐
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1. PRINTABLE EXAM PAPER RENDER */}
                {resultViewMode === 'paper' && (
                  <div
                    style={{
                      fontFamily:
                        fontFamily === 'Prompt'
                          ? 'Prompt, sans-serif'
                          : fontFamily === 'Kanit'
                          ? 'Kanit, sans-serif'
                          : 'Sarabun, sans-serif',
                    }}
                    className={`bg-white rounded-3xl border border-slate-200 shadow-lg p-10 space-y-6 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:rounded-none print:max-w-none print-container ${
                      fontSize === 'small'
                        ? 'text-xs'
                        : fontSize === 'large'
                        ? 'text-base'
                        : fontSize === 'xlarge'
                        ? 'text-lg'
                        : 'text-sm'
                    }`}
                  >
                    {/* Header Paper */}
                    <div className="border-b-2 border-slate-800 pb-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                        ) : (
                          <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400 text-xs border border-slate-200 print:hidden">
                            [โลโก้]
                          </div>
                        )}
                        <div className="text-center flex-1">
                          <h1 className="text-base font-bold text-slate-900 leading-tight">{schoolName}</h1>
                          <h2 className="text-sm font-extrabold text-slate-900 leading-tight">{examTitle}</h2>
                          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-xs text-slate-700 font-semibold pt-0.5">
                            <span>{subjectName}</span>
                            <span>•</span>
                            <span>{teacherName}</span>
                            <span>•</span>
                            <span>{examTime}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="inline-block bg-slate-900 text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-xs">
                            ชุด: {activePreviewVersion} {showTeacherKeyOnPaper && '(เฉลยครู)'}
                          </span>
                        </div>
                      </div>

                      {/* Numbered Instructions Block */}
                      {instructionText.trim() && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 leading-snug">
                          <span className="font-bold text-slate-900 mr-1.5">คำชี้แจง:</span>
                          {formatInstructionsToList(instructionText).map((line, idx) => (
                            <span key={idx} className="mr-3 inline-block">
                              {line.match(/^(\d+|[ก-ฮa-zA-Z])[\.\)\:]/) ? line : `${idx + 1}. ${line}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-slate-700 font-semibold flex items-center justify-between gap-4 border-b border-slate-300 pb-1.5">
                      <div className="flex-1 flex items-center gap-1.5">
                        <span className="whitespace-nowrap">ชื่อ-นามสกุล:</span>
                        <div className="flex-1 border-b border-dotted border-slate-600 h-3.5"></div>
                      </div>
                      <div className="w-28 flex items-center gap-1.5">
                        <span className="whitespace-nowrap">ชั้น:</span>
                        <div className="flex-1 border-b border-dotted border-slate-600 h-3.5"></div>
                      </div>
                      <div className="w-24 flex items-center gap-1.5">
                        <span className="whitespace-nowrap">เลขที่:</span>
                        <div className="flex-1 border-b border-dotted border-slate-600 h-3.5"></div>
                      </div>
                    </div>

                    {/* Questions Render */}
                    <div
                      style={
                        paperColumns === 2
                          ? {
                              columnCount: 2,
                              columnGap: '1.5rem',
                              columnRule: '1px solid #cbd5e1',
                            }
                          : undefined
                      }
                      className={`${
                        paperSpacing === 'compact'
                          ? 'space-y-2.5'
                          : paperSpacing === 'spacious'
                          ? 'space-y-8'
                          : 'space-y-4'
                      }`}
                    >
                      {generatedVersions
                        .find((v) => v.versionCode === activePreviewVersion)
                        ?.questions.map((q, idx, allQs) => {
                          const qSec =
                            q.section ||
                            (q.type === 'coding_output' || q.type === 'fill_blank' || q.type === 'matching'
                              ? 2
                              : q.type === 'essay'
                              ? 3
                              : 1);
                          const prevQ = idx > 0 ? allQs[idx - 1] : null;
                          const prevSec = prevQ
                            ? prevQ.section ||
                              (prevQ.type === 'coding_output' || prevQ.type === 'fill_blank' || prevQ.type === 'matching'
                                ? 2
                                : prevQ.type === 'essay'
                                ? 3
                                : 1)
                            : null;
                          const isNewSection = idx === 0 || qSec !== prevSec;

                          let secTitle = mcTitle;
                          let secInstruction = mcInstruction;
                          if (qSec === 2) {
                            secTitle = fillTitle;
                            secInstruction = fillInstruction;
                          } else if (qSec === 3) {
                            secTitle = essayTitle;
                            secInstruction = essayInstruction;
                          } else if (qSec === 4) {
                            secTitle = matchingTitle;
                            secInstruction = matchingInstruction;
                          }

                          return (
                            <div key={idx} className="space-y-1.5 print-keep-together break-inside-avoid mb-2.5">
                              {isNewSection && (
                                <div className="mt-1 mb-1.5 px-2.5 py-1.5 bg-slate-100 border-l-4 border-slate-900 rounded-r-lg print:bg-slate-100">
                                  <input
                                    type="text"
                                    value={secTitle}
                                    onChange={(e) => {
                                      if (qSec === 2) setFillTitle(e.target.value);
                                      else if (qSec === 3) setEssayTitle(e.target.value);
                                      else if (qSec === 4) setMatchingTitle(e.target.value);
                                      else setMcTitle(e.target.value);
                                    }}
                                    className="w-full bg-transparent font-extrabold text-xs text-slate-900 leading-tight focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-500 rounded px-1 -mx-1"
                                    title="คลิกเพื่อแก้ไขชื่อตอนได้ทันที"
                                  />
                                  <input
                                    type="text"
                                    value={secInstruction}
                                    onChange={(e) => {
                                      if (qSec === 2) setFillInstruction(e.target.value);
                                      else if (qSec === 3) setEssayInstruction(e.target.value);
                                      else if (qSec === 4) setMatchingInstruction(e.target.value);
                                      else setMcInstruction(e.target.value);
                                    }}
                                    className="w-full bg-transparent text-[11px] font-medium text-slate-700 leading-tight focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-500 rounded px-1 -mx-1 mt-0.5"
                                    title="คลิกเพื่อแก้ไขคำชี้แจงประจำตอนได้ทันที"
                                  />
                                </div>
                              )}

                              <div className="space-y-1">
                            <div className="text-xs md:text-sm font-bold text-slate-900 flex items-start gap-1 leading-snug">
                              <span>{idx + 1}.</span>
                              <FormattedMathText text={q.text} />
                            </div>

                            {q.imageUrl && (
                              <div className="pl-3 my-1">
                                <img
                                  src={q.imageUrl}
                                  alt={`โจทย์ข้อ ${idx + 1}`}
                                  className="max-h-36 max-w-full object-contain rounded border border-slate-200"
                                />
                              </div>
                            )}

                            {/* Multiple Choice Options */}
                            {(!q.type || q.type === 'multiple_choice') && (
                              <div className={`${getOptionGridClass(q.options)} pl-3 text-xs font-medium text-slate-800`}>
                                {q.options.map((opt, oIdx) => {
                                  const isCorrect = showTeacherKeyOnPaper && q.correctOptionIndex === oIdx;
                                  return (
                                    <div
                                      key={oIdx}
                                      className={`flex items-start gap-1 py-0.5 px-1 rounded transition leading-snug ${
                                        isCorrect
                                          ? 'bg-emerald-100/80 text-emerald-900 font-bold border border-emerald-300'
                                          : ''
                                      }`}
                                    >
                                      <span className="font-bold flex-shrink-0">{CHOICE_LABELS[oIdx]}.</span>
                                      <FormattedMathText text={cleanOptionText(opt.text)} />
                                      {isCorrect && (
                                        <span className="text-[10px] bg-emerald-700 text-white px-1 py-0 rounded font-bold ml-1 flex-shrink-0">
                                          ✓
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Fill-in-the-blank Question Render */}
                            {q.type === 'fill_blank' && (
                              <div className="pl-3 py-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800 text-xs">ตอบ:</span>
                                  <div className="flex-1 border-b border-slate-800 min-h-[20px] px-2 flex items-center font-bold text-emerald-800 text-xs">
                                    {showTeacherKeyOnPaper && q.correctAnswerText ? q.correctAnswerText : ''}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Coding Output / Multi-subitem Fill-in Question Render */}
                            {q.type === 'coding_output' && (
                              <div className="pl-3 py-1 space-y-2">
                                {q.codeSnippet && (
                                  <div className="space-y-0.5">
                                    <span className="text-[11px] font-bold text-slate-700 block">กำหนดโค้ดดังนี้:</span>
                                    <pre className="p-2 bg-slate-100 border border-slate-300 rounded-lg font-mono text-[11px] text-slate-900 whitespace-pre-wrap leading-tight overflow-x-auto print:bg-slate-50">
                                      {q.codeSnippet}
                                    </pre>
                                  </div>
                                )}

                                {(q.subItems || []).length > 0 && (
                                  <div className="space-y-2 pt-1">
                                    <span className="text-[11px] font-bold text-slate-800 block">
                                      จงเติมผลลัพธ์ที่ได้จากการทำงานของโปรแกรม:
                                    </span>
                                    <div className="space-y-2 pl-1">
                                      {(q.subItems || []).map((sub, sIdx) => {
                                        const isLongLabel = (sub.label || '').length > 18;
                                        return (
                                          <div
                                            key={sIdx}
                                            className={`${
                                              isLongLabel || paperColumns === 2
                                                ? 'flex flex-col gap-1 py-0.5'
                                                : 'flex items-center gap-2 py-0.5'
                                            } text-xs`}
                                          >
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-bold text-slate-800 w-4 shrink-0">{sIdx + 1}.</span>
                                              <code className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px] break-all">
                                                {sub.label}
                                              </code>
                                              {!(isLongLabel || paperColumns === 2) && (
                                                <span className="font-bold text-slate-700">=</span>
                                              )}
                                            </div>
                                            <div
                                              className={`flex items-center gap-1.5 ${
                                                isLongLabel || paperColumns === 2 ? 'pl-5 w-full' : 'flex-1 min-w-[180px]'
                                              }`}
                                            >
                                              {(isLongLabel || paperColumns === 2) && (
                                                <span className="font-bold text-slate-600 text-[11px] shrink-0">ตอบ =</span>
                                              )}
                                              <div className="flex-1 border-b-2 border-dotted border-slate-800 min-h-[24px] px-2 flex items-center font-mono font-bold text-emerald-700 text-xs">
                                                {showTeacherKeyOnPaper ? sub.answer : ''}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Essay / Subjective Question Render */}
                            {q.type === 'essay' && (
                              <div className="pl-4 py-2 space-y-2">
                                <div className="border-2 border-slate-800 rounded-xl p-3 min-h-[100px] bg-white space-y-3">
                                  <span className="text-xs text-slate-500 font-semibold block">
                                    แสดงวิธีทำ / เขียนอธิบายคำตอบ:
                                  </span>
                                  <div className="border-b border-dotted border-slate-400 h-4"></div>
                                  <div className="border-b border-dotted border-slate-400 h-4"></div>
                                  <div className="border-b border-dotted border-slate-400 h-4"></div>
                                  {showTeacherKeyOnPaper && q.correctAnswerText && (
                                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900">
                                      🔑 แนวทางการตอบ: {q.correctAnswerText}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Matching Question Render on Test Paper */}
                            {q.type === 'matching' && (
                              <div className="pl-4 py-2 space-y-3">
                                <p className="text-xs font-bold text-slate-700">
                                  คำสั่ง: จงเลือกตัวอักษร (ก, ข, ค...) ฝั่งขวา นำมาเติมลงในช่อง [ &nbsp; ] หน้าข้อความฝั่งซ้ายให้ถูกต้อง
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border border-slate-300 rounded-xl p-4 bg-slate-50/40">
                                  <div className="space-y-2.5">
                                    <h4 className="font-extrabold text-slate-900 border-b border-slate-300 pb-1">รายการฝั่งซ้าย</h4>
                                    {(q.matchingPairs || []).map((pair, pIdx) => (
                                      <div key={pIdx} className="flex items-center gap-2">
                                        <span className="font-bold border-b-2 border-slate-800 px-2.5 py-0.5 text-center inline-block min-w-[36px] text-slate-900 bg-white rounded">
                                          {showTeacherKeyOnPaper ? CHOICE_LABELS[pIdx] || pIdx + 1 : ' '}
                                        </span>
                                        <span className="font-semibold text-slate-900">{pIdx + 1}. {pair.left}</span>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="space-y-2.5">
                                    <h4 className="font-extrabold text-slate-900 border-b border-slate-300 pb-1">ตัวเลือกฝั่งขวา</h4>
                                    {(q.matchingPairs || []).map((pair, pIdx) => (
                                      <div key={pIdx} className="font-semibold text-slate-900">
                                        <span className="font-bold text-slate-800 mr-1.5">{CHOICE_LABELS[pIdx] || pIdx + 1}.</span>
                                        <span>{pair.right}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>

                    {/* Bottom Teacher Answer Key Box */}
                    {showTeacherKeyOnPaper && (
                      <div className="mt-8 pt-4 border-t-2 border-dashed border-emerald-500 bg-emerald-50/50 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ตารางสรุปเฉลยคำตอบ (สำหรับครูตรวจข้อสอบ - ชุดข้อสอบ {activePreviewVersion})
                          </h4>
                        </div>
                        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 text-xs font-semibold text-slate-800">
                          {generatedVersions
                            .find((v) => v.versionCode === activePreviewVersion)
                            ?.questions.map((q, idx) => (
                              <div key={idx} className="bg-white p-1.5 rounded-lg border border-emerald-200 text-center shadow-2xs">
                                <span className="text-slate-500 text-[10px] block font-normal">ข้อ {idx + 1}</span>
                                <span className="text-emerald-700 font-extrabold text-sm">
                                  {q.type === 'fill_blank' || q.type === 'essay'
                                    ? 'ข้อเขียน'
                                    : q.type === 'coding_output'
                                    ? 'เติมผลลัพธ์'
                                    : q.type === 'matching'
                                    ? 'จับคู่'
                                    : CHOICE_LABELS[q.correctOptionIndex]}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. PRINTABLE ANSWER SHEET RENDER */}
                {resultViewMode === 'sheet' && (() => {
                  const currentVer = generatedVersions.find((v) => v.versionCode === activePreviewVersion);
                  const versionQuestions = currentVer?.questions || [];
                  const mcQs = versionQuestions.filter((q) => !q.type || q.type === 'multiple_choice');
                  const subjectiveQs = versionQuestions.filter(
                    (q) => q.type === 'fill_blank' || q.type === 'essay' || q.type === 'matching' || q.type === 'coding_output'
                  );

                  const optLabels = sheetOptionStyle === 'thai' ? CHOICE_LABELS : ['A', 'B', 'C', 'D', 'E'];
                  const colsCount = mcQs.length <= 20 ? 2 : mcQs.length <= 40 ? 2 : mcQs.length <= 60 ? 3 : 4;
                  const perCol = Math.max(1, Math.ceil(mcQs.length / colsCount));

                  const getBoxSizeClass = () => {
                    if (sheetMarkType === 'cross') {
                      return sheetBoxSize === 'xlarge' ? 'w-8 h-8' : sheetBoxSize === 'large' ? 'w-7 h-7' : 'w-6 h-6';
                    } else {
                      return sheetBoxSize === 'xlarge' ? 'w-7 h-7' : sheetBoxSize === 'large' ? 'w-6 h-6' : 'w-5 h-5';
                    }
                  };

                  return (
                    <div
                      id="printable-answer-sheet"
                      style={{
                        fontFamily:
                          fontFamily === 'Prompt'
                            ? 'Prompt, sans-serif'
                            : fontFamily === 'Kanit'
                            ? 'Kanit, sans-serif'
                            : 'Sarabun, sans-serif',
                      }}
                      className="bg-white rounded-3xl border border-slate-300 shadow-xl p-8 space-y-5 text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print-container"
                    >
                      {/* Paper Header Box */}
                      <div className="border-2 border-slate-900 rounded-xl p-4 space-y-3 relative">
                        <div className="flex items-center gap-3 border-b border-slate-300 pb-2">
                          {logoUrl && (
                            <img src={logoUrl} alt="Logo" className="w-14 h-14 object-contain flex-shrink-0" />
                          )}
                          <div className="flex-1 text-center">
                            <h1 className="text-xl font-bold tracking-tight text-slate-900">{schoolName}</h1>
                            <h2 className="text-sm font-semibold text-slate-800">{examTitle}</h2>
                            <p className="text-xs font-medium text-slate-700">{subjectName}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                              ชุดข้อสอบ: {activePreviewVersion} {showTeacherKeyOnPaper && '(ฉบับเฉลยครู)'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-800 pt-1">
                          <span>{teacherName}</span>
                          <span>{examTime}</span>
                          <span>จำนวน: {versionQuestions.length} ข้อ</span>
                        </div>

                        {instructionText.trim() && (
                          <div className="font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded p-2 text-xs space-y-1">
                            <p className="font-bold text-slate-900 text-[11px]">คำชี้แจง / คำสั่งในการทำข้อสอบ:</p>
                            {formatInstructionsToList(instructionText).map((line, idx) => (
                              <p key={idx} className="pl-1 text-[11px]">
                                {line.match(/^(\d+|[ก-ฮa-zA-Z])[\.\)\:]/) ? line : `${idx + 1}. ${line}`}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Student Fields */}
                        <div className="pt-1 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs font-semibold text-slate-900">
                          <div className="flex-1 flex items-center gap-1.5">
                            <span className="whitespace-nowrap">ชื่อ-นามสกุล:</span>
                            <div className="flex-1 border-b-2 border-dotted border-slate-600 h-3.5"></div>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="w-36 flex items-center gap-1">
                              <span className="whitespace-nowrap">เลขประจำตัว:</span>
                              <div className="flex-1 border-b-2 border-dotted border-slate-600 h-3.5"></div>
                            </div>
                            <div className="w-24 flex items-center gap-1">
                              <span className="whitespace-nowrap">ชั้น/ห้อง:</span>
                              <div className="flex-1 border-b-2 border-dotted border-slate-600 h-3.5"></div>
                            </div>
                            <div className="w-20 flex items-center gap-1">
                              <span className="whitespace-nowrap">เลขที่:</span>
                              <div className="flex-1 border-b-2 border-dotted border-slate-600 h-3.5"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 1: Multiple Choice Grid */}
                      {mcQs.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-slate-900 border-b border-slate-300 pb-1">
                            ส่วนที่ 1: ข้อสอบปรนัย (ตอบลงในช่องกากบาท / ฝนวงกลม)
                          </h3>
                          <div className={`grid grid-cols-${colsCount} gap-3`}>
                            {Array.from({ length: colsCount }).map((_, colIdx) => {
                              const colMcQuestions = mcQs.slice(colIdx * perCol, (colIdx + 1) * perCol);
                              if (colMcQuestions.length === 0) return null;

                              return (
                                <div key={colIdx} className="border border-slate-400 rounded-lg p-2.5 space-y-1.5">
                                  <div className="flex items-center font-bold text-xs text-slate-800 border-b border-slate-300 pb-1">
                                    <span className="w-8 text-center">ข้อ</span>
                                    <div className="flex-1 flex justify-around pl-1">
                                      {Array.from({ length: 4 }).map((_, oIdx) => (
                                        <span key={oIdx} className="w-7 text-center font-bold">
                                          {optLabels[oIdx]}.
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    {colMcQuestions.map((q) => {
                                      const qNum = versionQuestions.indexOf(q) + 1;
                                      return (
                                        <div
                                          key={q.questionIndexOriginal}
                                          className="flex items-center text-xs font-semibold text-slate-800 border-b border-slate-100 last:border-none py-1"
                                        >
                                          <span className="w-8 text-center font-bold text-slate-800">{qNum}.</span>
                                          <div className="flex-1 flex justify-around pl-1">
                                            {Array.from({ length: 4 }).map((_, oIdx) => {
                                              const isKey = showTeacherKeyOnPaper && q.correctOptionIndex === oIdx;
                                              return (
                                                <div key={oIdx} className="w-7 flex justify-center items-center">
                                                  {sheetMarkType === 'cross' ? (
                                                    <div
                                                      className={`border-2 border-slate-900 rounded flex items-center justify-center transition ${getBoxSizeClass()} ${
                                                        isKey ? 'bg-slate-900 text-white font-black shadow-xs' : ''
                                                      }`}
                                                    >
                                                      {isKey && '✕'}
                                                    </div>
                                                  ) : (
                                                    <div
                                                      className={`border-2 border-slate-900 rounded-full flex items-center justify-center transition ${getBoxSizeClass()} ${
                                                        isKey ? 'bg-slate-900 text-white font-black shadow-xs' : ''
                                                      }`}
                                                    >
                                                      {isKey && '●'}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* SECTION 2: Subjective & Matching Write-in Area */}
                      {subjectiveQs.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <h3 className="text-xs font-bold text-slate-900 border-b border-slate-300 pb-1">
                            ส่วนที่ 2: ข้อสอบจับคู่ / เติมคำ / เขียนตอบ
                          </h3>
                          <div className="space-y-3">
                            {subjectiveQs.map((q) => {
                              const qNum = versionQuestions.indexOf(q) + 1;
                              return (
                                <div key={q.questionIndexOriginal} className="p-3 border border-slate-300 rounded-xl space-y-1.5">
                                  <p className="text-xs font-bold text-slate-900">
                                    ข้อ {qNum}. <FormattedMathText text={q.text} />
                                  </p>

                                  {q.type === 'fill_blank' && (
                                    <div className="flex items-center gap-2 pt-1">
                                      <span className="text-xs font-bold text-slate-800">ตอบ:</span>
                                      <div className="flex-1 border-b-2 border-slate-800 min-h-[26px] px-2 flex items-center text-xs font-bold text-emerald-800">
                                        {showTeacherKeyOnPaper && q.correctAnswerText ? q.correctAnswerText : ''}
                                      </div>
                                    </div>
                                  )}

                                  {q.type === 'coding_output' && (
                                    <div className="space-y-2.5 pt-1.5">
                                      {(q.subItems || []).map((sub, sIdx) => {
                                        const isLongLabel = (sub.label || '').length > 22;
                                        return (
                                          <div
                                            key={sIdx}
                                            className={`${
                                              isLongLabel ? 'flex flex-col gap-1' : 'flex items-center gap-2'
                                            } text-xs`}
                                          >
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-bold text-slate-800 w-5 shrink-0">{sIdx + 1}.</span>
                                              <code className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                {sub.label}
                                              </code>
                                              {!isLongLabel && <span className="font-bold text-slate-700">=</span>}
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${isLongLabel ? 'pl-6 w-full' : 'flex-1'}`}>
                                              {isLongLabel && <span className="font-bold text-slate-600 shrink-0">ตอบ =</span>}
                                              <div className="flex-1 border-b-2 border-dotted border-slate-800 min-h-[26px] px-2 flex items-center font-mono font-bold text-emerald-800">
                                                {showTeacherKeyOnPaper ? sub.answer : ''}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {q.type === 'essay' && (
                                    <div className="border-2 border-slate-800 rounded-xl p-2.5 min-h-[85px] bg-slate-50/20 space-y-2">
                                      <span className="text-[11px] text-slate-500 font-semibold block">
                                        ตอบ (แสดงวิธีทำ / เขียนอธิบาย):
                                      </span>
                                      <div className="border-b border-dotted border-slate-400 h-3.5"></div>
                                      <div className="border-b border-dotted border-slate-400 h-3.5"></div>
                                      {showTeacherKeyOnPaper && q.correctAnswerText && (
                                        <div className="mt-1 p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900">
                                          🔑 แนวทางตอบ: {q.correctAnswerText}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {q.type === 'matching' && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                                      {(q.matchingPairs || []).map((pair, pIdx) => (
                                        <div key={pIdx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-xs">
                                          <span className="font-bold text-slate-800">ข้อ {pIdx + 1}:</span>
                                          <div className="w-8 h-7 border-2 border-slate-900 rounded flex items-center justify-center font-extrabold text-slate-900 bg-white shadow-2xs">
                                            {showTeacherKeyOnPaper ? CHOICE_LABELS[pIdx] || pIdx + 1 : ''}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex justify-between items-end border-t border-slate-300 pt-2 text-[10px] text-slate-500 font-medium">
                        <span>กระดาษคำตอบ | {schoolName}</span>
                        <span>ชุดข้อสอบ: {activePreviewVersion}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. MASTER ANSWER KEY TABLE */}
                {resultViewMode === 'key' && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <div>
                        <h2 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> ตารางเฉลยข้อสอบรวม (Master Answer Key)
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          เปรียบเทียบคำตอบที่ถูกต้องของข้อสอบแต่ละชุด (A, B, C...) เพื่อความสะดวกในการตรวจข้อสอบ
                        </p>
                      </div>

                      <button
                        onClick={handleCopyMasterKey}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-200 transition"
                      >
                        <Copy className="w-4 h-4" />
                        {copiedKeySuccess ? '✓ คัดลอกตารางเฉลยแล้ว!' : 'คัดลอกตารางเฉลย'}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <th className="p-3 border-r border-slate-200">ลำดับโจทย์เดิม</th>
                            {generatedVersions.map((v) => (
                              <th key={v.versionCode} className="p-3 text-center border-r border-slate-200">
                                เฉลยชุด {v.versionCode}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {questions.map((q, origIdx) => (
                            <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="p-3 font-semibold text-slate-800 border-r border-slate-200">
                                ข้อ {origIdx + 1}: <FormattedMathText text={q.text.substring(0, 30)} />...
                              </td>
                              {generatedVersions.map((v) => {
                                const qInVersion = v.questions.find(
                                  (item) => item.questionIndexOriginal === origIdx
                                );
                                if (!qInVersion) return <td key={v.versionCode}>-</td>;

                                const correctChoiceLabel =
                                  qInVersion.type === 'coding_output'
                                    ? (qInVersion.subItems || []).map((s, i) => `${i + 1})${s.answer}`).join(', ')
                                    : qInVersion.type === 'fill_blank' || qInVersion.type === 'essay'
                                    ? `[${qInVersion.correctAnswerText || 'ข้อเขียน'}]`
                                    : CHOICE_LABELS[qInVersion.correctOptionIndex];
                                return (
                                  <td
                                    key={v.versionCode}
                                    className="p-3 text-center border-r border-slate-200 font-bold text-emerald-700 bg-emerald-50/30"
                                  >
                                    ข้อ {v.questions.indexOf(qInVersion) + 1} ➔ ตอบ {correctChoiceLabel}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
      </div>

      {/* Save to Exam Bank Modal */}
      {saveBankModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Save className="w-5 h-5 text-brand-600" /> บันทึกลงคลังข้อสอบ
              </h3>
              <button
                onClick={() => setSaveBankModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อชุดข้อสอบ (Exam Title)
                </label>
                <input
                  type="text"
                  value={bankTitleInput}
                  onChange={(e) => setBankTitleInput(e.target.value)}
                  placeholder="เช่น ข้อสอบปลายภาค วิชาการงานอาชีพ ม.1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หมวดหมู่ / วิชา (Subject)
                </label>
                <input
                  type="text"
                  value={bankSubjectInput}
                  onChange={(e) => setBankSubjectInput(e.target.value)}
                  placeholder="เช่น วิชาการงานอาชีพ (ง21101)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600">
                <p>• จำนวนข้อสอบที่จะบันทึก: <span className="font-bold text-brand-700">{questions.length} ข้อ</span></p>
                <p>• จะบันทึกพร้อมโลโก้, คำชี้แจง และเฉลยลงคลังข้อสอบถาวร</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSaveBankModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveToBank}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> บันทึกลงคลัง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bank Item Modal */}
      {editBankModalOpen && editingBankItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand-600" /> ✏️ แก้ไขข้อมูลชุดข้อสอบในคลัง
              </h3>
              <button
                onClick={() => {
                  setEditBankModalOpen(false);
                  setEditingBankItem(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อรายการชุดข้อสอบในคลัง (Title)
                </label>
                <input
                  type="text"
                  value={editingBankItem.title}
                  onChange={(e) =>
                    setEditingBankItem({ ...editingBankItem, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หมวดหมู่ / ชื่อวิชา (Subject)
                </label>
                <input
                  type="text"
                  value={editingBankItem.subject}
                  onChange={(e) =>
                    setEditingBankItem({ ...editingBankItem, subject: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อโรงเรียน / สถาบัน
                </label>
                <input
                  type="text"
                  value={editingBankItem.headerConfig?.schoolName || ''}
                  onChange={(e) =>
                    setEditingBankItem({
                      ...editingBankItem,
                      headerConfig: {
                        ...(editingBankItem.headerConfig || {}),
                        schoolName: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หัวเรื่องแบบทดสอบ
                </label>
                <input
                  type="text"
                  value={editingBankItem.headerConfig?.examTitle || ''}
                  onChange={(e) =>
                    setEditingBankItem({
                      ...editingBankItem,
                      headerConfig: {
                        ...(editingBankItem.headerConfig || {}),
                        examTitle: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ครูผู้สอน
                  </label>
                  <input
                    type="text"
                    value={editingBankItem.headerConfig?.teacherName || ''}
                    onChange={(e) =>
                      setEditingBankItem({
                        ...editingBankItem,
                        headerConfig: {
                          ...(editingBankItem.headerConfig || {}),
                          teacherName: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เวลาในการทำ
                  </label>
                  <input
                    type="text"
                    value={editingBankItem.headerConfig?.examTime || ''}
                    onChange={(e) =>
                      setEditingBankItem({
                        ...editingBankItem,
                        headerConfig: {
                          ...(editingBankItem.headerConfig || {}),
                          examTime: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำชี้แจงหลัก
                </label>
                <textarea
                  rows={2}
                  value={editingBankItem.headerConfig?.instructionText || ''}
                  onChange={(e) =>
                    setEditingBankItem({
                      ...editingBankItem,
                      headerConfig: {
                        ...(editingBankItem.headerConfig || {}),
                        instructionText: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setEditBankModalOpen(false);
                  setEditingBankItem(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEditBankModal}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
