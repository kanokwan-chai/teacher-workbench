import { Question, QualityCheckResult, QualityIssue, QuestionSet } from '@/types';

export function runQualityCheck(questions: Question[]): QualityCheckResult {
  const issues: QualityIssue[] = [];
  const answerCounts = { A: 0, B: 0, C: 0, D: 0 };
  const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
  const cognitiveCounts = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0,
  };

  const totalQuestions = questions.length;

  questions.forEach((q, idx) => {
    // 1. Difficulty & Cognitive tally
    if (q.difficulty && difficultyCounts[q.difficulty] !== undefined) {
      difficultyCounts[q.difficulty]++;
    }
    if (q.cognitiveLevel && cognitiveCounts[q.cognitiveLevel] !== undefined) {
      cognitiveCounts[q.cognitiveLevel]++;
    }

    // 2. Check Multiple Choice questions
    if (q.type === 'multiple_choice' && q.options) {
      const correctOpts = q.options.filter((o) => o.isCorrect);
      
      // Check 1: Exactly 1 correct answer
      if (correctOpts.length === 0) {
        issues.push({
          questionOrder: q.questionOrder,
          severity: 'ERROR',
          code: 'NO_CORRECT_ANSWER',
          message: `ข้อที่ ${q.questionOrder}: ไม่มีตัวเลือกที่ถูกต้อง`,
          recommendation: 'กำหนดตัวเลือกที่ถูกต้อง 1 ข้อ',
        });
      } else if (correctOpts.length > 1) {
        issues.push({
          questionOrder: q.questionOrder,
          severity: 'ERROR',
          code: 'MULTIPLE_CORRECT_ANSWERS',
          message: `ข้อที่ ${q.questionOrder}: มีตัวเลือกที่ถูกต้องมากกว่า 1 ข้อ`,
          recommendation: 'ให้มีคำตอบถูกเพียงข้อเดียวเท่านั้น',
        });
      } else {
        const correctKey = correctOpts[0].optionKey as 'A' | 'B' | 'C' | 'D';
        if (answerCounts[correctKey] !== undefined) {
          answerCounts[correctKey]++;
        }
      }

      // Check 2: Distractor length symmetry
      const correctOptText = correctOpts[0]?.optionText || '';
      const wrongOptTexts = q.options.filter((o) => !o.isCorrect).map((o) => o.optionText);
      const avgWrongLength =
        wrongOptTexts.reduce((acc, t) => acc + t.length, 0) / (wrongOptTexts.length || 1);

      if (correctOptText.length > avgWrongLength * 2.2 && correctOptText.length > 30) {
        issues.push({
          questionOrder: q.questionOrder,
          severity: 'WARNING',
          code: 'CORRECT_OPTION_TOO_LONG',
          message: `ข้อที่ ${q.questionOrder}: ตัวเลือกที่ถูก (${correctOpts[0]?.optionKey}) ยาวกว่าตัวเลือกอื่นชัดเจน`,
          recommendation: 'ปรับความยาวตัวเลือกทั้งหมดให้ใกล้เคียงกันเพื่อไม่ให้ใบ้คำตอบ',
        });
      }

      // Check 3: Duplicate options
      const optTexts = q.options.map((o) => o.optionText.trim().toLowerCase());
      const uniqueOpts = new Set(optTexts);
      if (uniqueOpts.size < optTexts.length) {
        issues.push({
          questionOrder: q.questionOrder,
          severity: 'ERROR',
          code: 'DUPLICATE_OPTIONS',
          message: `ข้อที่ ${q.questionOrder}: มีตัวเลือกข้อความซ้ำกัน`,
          recommendation: 'แก้ไขตัวเลือกที่ซ้ำกันให้มีความแตกต่างชัดเจน',
        });
      }
    }
  });

  // 3. Answer Distribution Check (for MCQ sets with >= 4 questions)
  const mcqCount = questions.filter((q) => q.type === 'multiple_choice').length;
  if (mcqCount >= 4) {
    const maxAllowedPerKey = Math.ceil(mcqCount * 0.45); // Max 45% for any single key
    (['A', 'B', 'C', 'D'] as const).forEach((key) => {
      if (answerCounts[key] > maxAllowedPerKey) {
        issues.push({
          questionOrder: 0,
          severity: 'WARNING',
          code: 'ANSWER_DISTRIBUTION_UNBALANCED',
          message: `การกระจายคำตอบไม่สมดุล: ข้อที่เป็นเฉลยข้อ ${key} มีมากถึง ${answerCounts[key]} ข้อจาก ${mcqCount} ข้อ`,
          recommendation: 'สลับตำแหน่งตัวเลือก A/B/C/D ให้เฉลี่ยเท่าๆ กัน',
        });
      }
    });

    // Consecutive identical keys check (e.g. A A A A)
    let consecutiveCount = 1;
    let lastKey = '';
    questions.forEach((q) => {
      if (q.type === 'multiple_choice' && q.options) {
        const correct = q.options.find((o) => o.isCorrect)?.optionKey || '';
        if (correct === lastKey && correct !== '') {
          consecutiveCount++;
          if (consecutiveCount >= 4) {
            issues.push({
              questionOrder: q.questionOrder,
              severity: 'WARNING',
              code: 'CONSECUTIVE_ANSWERS',
              message: `พบคำตอบซ้ำตัวละครเดิม (${lastKey}) ติดต่อกัน ${consecutiveCount} ข้อ`,
              recommendation: 'สลับคำตอบเพื่อป้องกันนักเรียนเดา Pattern',
            });
          }
        } else {
          consecutiveCount = 1;
          lastKey = correct;
        }
      }
    });
  }

  // Determine overall status
  const hasErrors = issues.some((i) => i.severity === 'ERROR');
  const hasWarnings = issues.some((i) => i.severity === 'WARNING');
  const overallStatus = hasErrors ? 'ERROR' : hasWarnings ? 'WARNING' : 'PASS';

  return {
    overallStatus,
    answerDistribution: answerCounts,
    difficultyDistribution: difficultyCounts,
    cognitiveDistribution: cognitiveCounts,
    issues,
  };
}

/**
 * Balance Answer Distribution (A/B/C/D) automatically without changing content meaning
 */
export function balanceAnswerDistribution(questions: Question[]): Question[] {
  const mcqs = questions.filter((q) => q.type === 'multiple_choice' && q.options && q.options.length === 4);
  if (mcqs.length === 0) return questions;

  const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  
  return questions.map((q, idx) => {
    if (q.type !== 'multiple_choice' || !q.options || q.options.length !== 4) return q;

    // Pick a target key for this question to ensure balanced sequence
    const targetKey = keys[idx % 4];
    const currentCorrectIdx = q.options.findIndex((o) => o.isCorrect);

    if (currentCorrectIdx === -1) return q;

    const targetIdx = keys.indexOf(targetKey);
    if (currentCorrectIdx === targetIdx) return q;

    // Clone options array and swap target position
    const newOptions = [...q.options];
    const temp = newOptions[targetIdx];
    newOptions[targetIdx] = newOptions[currentCorrectIdx];
    newOptions[currentCorrectIdx] = temp;

    // Re-assign option keys A, B, C, D
    const rekeyedOptions = newOptions.map((opt, i) => ({
      ...opt,
      optionKey: keys[i],
    }));

    return {
      ...q,
      options: rekeyedOptions,
    };
  });
}
