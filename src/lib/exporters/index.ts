import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import jsPDF from 'jspdf';
import { QuestionSet, Worksheet, LessonSummary } from '@/types';

/**
 * Generate DOCX for Exam Question Set
 */
export async function generateQuestionSetDocx(
  qs: QuestionSet,
  mode: 'exam' | 'key' | 'answer_sheet' | 'exam_and_key'
): Promise<Blob> {
  const docChildren: any[] = [];

  // Header
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `แบบทดสอบ: ${qs.title}`,
          bold: true,
          size: 32, // 16pt
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `รายวิชา: ${qs.subject} | ระดับชั้น: ${qs.gradeLevel || 'ทั่วไป'} | จำนวน: ${qs.totalQuestions} ข้อ`,
          size: 24, // 12pt
          color: '555555',
        }),
      ],
    }),
    new Paragraph({ text: '' })
  );

  // Student Info Box (for exam and answer_sheet)
  if (mode === 'exam' || mode === 'answer_sheet' || mode === 'exam_and_key') {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'ชื่อ-นามสกุล: ............................................................................  ชั้น: ................  เลขที่: ..........', size: 24 }),
        ],
      }),
      new Paragraph({ text: '' })
    );
  }

  // Answer Sheet Mode
  if (mode === 'answer_sheet') {
    docChildren.push(
      new Paragraph({
        children: [new TextRun({ text: 'กระดาษคำตอบ (Answer Sheet)', bold: true, size: 28 })],
      }),
      new Paragraph({ text: '' })
    );

    const rows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ข้อที่', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ก (A)', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ข (B)', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ค (C)', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ง (D)', bold: true })] })] }),
        ],
      }),
    ];

    qs.questions.forEach((q) => {
      rows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: `${q.questionOrder}` })] }),
            new TableCell({ children: [new Paragraph({ text: '[   ]' })] }),
            new TableCell({ children: [new Paragraph({ text: '[   ]' })] }),
            new TableCell({ children: [new Paragraph({ text: '[   ]' })] }),
            new TableCell({ children: [new Paragraph({ text: '[   ]' })] }),
          ],
        })
      );
    });

    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
      })
    );
  } else {
    // Questions List
    qs.questions.forEach((q) => {
      const qChildren: TextRun[] = [
        new TextRun({ text: `${q.questionOrder}. `, bold: true, size: 26 }),
        new TextRun({ text: `${q.questionText}`, size: 26 }),
      ];

      if (mode === 'key' || mode === 'exam_and_key') {
        qChildren.push(
          new TextRun({ text: ` [คะแนน: ${q.score} | ความยาก: ${q.difficulty}]`, size: 20, color: '888888' })
        );
      }

      docChildren.push(new Paragraph({ children: qChildren }));

      // Code Snippet (if present)
      if (q.codeSnippet) {
        q.codeSnippet.split('\n').forEach((codeLine) => {
          docChildren.push(
            new Paragraph({
              indent: { left: 720 },
              children: [
                new TextRun({
                  text: codeLine,
                  font: 'Courier New',
                  size: 22,
                  color: '1E293B',
                }),
              ],
            })
          );
        });
      }

      // Sub-items for coding output / fill-in sub-questions
      if (q.subItems && q.subItems.length > 0) {
        q.subItems.forEach((sub, sIdx) => {
          const isKey = mode === 'key' || mode === 'exam_and_key';
          docChildren.push(
            new Paragraph({
              indent: { left: 720 },
              children: [
                new TextRun({
                  text: `${sIdx + 1}. ${sub.label} = `,
                  font: 'Courier New',
                  size: 24,
                  bold: true,
                }),
                new TextRun({
                  text: isKey ? `${sub.answer}  ✓` : '........................................',
                  bold: isKey,
                  color: isKey ? '008000' : '000000',
                  size: 24,
                }),
              ],
            })
          );
        });
      }

      // Multiple Choice Options
      if (q.type === 'multiple_choice' && q.options) {
        q.options.forEach((opt) => {
          const isAnswer = (mode === 'key' || mode === 'exam_and_key') && opt.isCorrect;
          docChildren.push(
            new Paragraph({
              indent: { left: 720 },
              children: [
                new TextRun({
                  text: `${opt.optionKey}) ${opt.optionText}`,
                  size: 24,
                  bold: isAnswer,
                  color: isAnswer ? '008000' : '000000',
                }),
                isAnswer ? new TextRun({ text: '  ✓ (เฉลยที่ถูกต้อง)', bold: true, color: '008000', size: 22 }) : new TextRun(''),
              ],
            })
          );
        });
      }

      // Other types (True/False, Fill in, Short answer)
      if (q.type !== 'multiple_choice' && q.correctAnswerText && (mode === 'key' || mode === 'exam_and_key')) {
        docChildren.push(
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `เฉลย: ${q.correctAnswerText}`, bold: true, color: '008000', size: 24 }),
            ],
          })
        );
      }

      // Explanation (if key mode)
      if ((mode === 'key' || mode === 'exam_and_key') && q.explanation) {
        docChildren.push(
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `คำอธิบายเฉลย: ${q.explanation}`, italics: true, color: '555555', size: 22 }),
            ],
          })
        );
      }

      docChildren.push(new Paragraph({ text: '' }));
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Generate client-side PDF for Exam Question Set
 */
export function generateQuestionSetPdf(
  qs: QuestionSet,
  mode: 'exam' | 'key' | 'answer_sheet' | 'exam_and_key'
): void {
  const doc = new jsPDF();
  
  let y = 20;
  doc.setFontSize(18);
  doc.text(`Title: ${qs.title}`, 20, y);
  y += 10;
  doc.setFontSize(12);
  doc.text(`Subject: ${qs.subject} | Total: ${qs.totalQuestions} Questions | Mode: ${mode}`, 20, y);
  y += 15;

  if (mode === 'answer_sheet') {
    doc.setFontSize(14);
    doc.text('Answer Sheet', 20, y);
    y += 10;
    qs.questions.forEach((q) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.text(`${q.questionOrder}.  [ A ]   [ B ]   [ C ]   [ D ]`, 20, y);
      y += 8;
    });
  } else {
    qs.questions.forEach((q) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      const line = `${q.questionOrder}. ${q.questionText}`;
      doc.text(line.substring(0, 80), 20, y);
      y += 7;

      if (q.type === 'multiple_choice' && q.options) {
        q.options.forEach((opt) => {
          if (y > 270) { doc.addPage(); y = 20; }
          const isAnswer = (mode === 'key' || mode === 'exam_and_key') && opt.isCorrect;
          const optLine = `   ${opt.optionKey}) ${opt.optionText} ${isAnswer ? ' [CORRECT]' : ''}`;
          doc.text(optLine.substring(0, 85), 20, y);
          y += 6;
        });
      }

      if ((mode === 'key' || mode === 'exam_and_key') && q.explanation) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.text(`   Explanation: ${q.explanation.substring(0, 80)}`, 20, y);
        y += 6;
      }

      y += 4;
    });
  }

  doc.save(`${qs.title.replace(/\s+/g, '_')}_${mode}.pdf`);
}

/**
 * Generate DOCX for Formatted Worksheet (ใบงาน / แบบฝึกหัด)
 */
export async function generateWorksheetDocx(
  ws: Worksheet,
  includeAnswerKey: boolean = false
): Promise<Blob> {
  const docChildren: any[] = [];

  // School Name
  if (ws.schoolName) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: ws.schoolName,
            bold: true,
            size: 30, // 15pt
          }),
        ],
      })
    );
  }

  // Worksheet Title
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${ws.title}${includeAnswerKey ? ' (ฉบับเฉลยครู)' : ''}`,
          bold: true,
          size: 32, // 16pt
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `รายวิชา: ${ws.subject} | ระดับชั้น: ${ws.gradeLevel || 'ทั่วไป'}${
            ws.teacherName ? ` | ${ws.teacherName}` : ''
          } | คะแนนเต็ม: ${ws.totalScore || 20} คะแนน | เวลา: ${ws.timeMinutes || 50} นาที`,
          size: 22,
          color: '444444',
        }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'ชื่อ-นามสกุล: ....................................................................................  ชั้น: ....................  เลขที่: ..............',
          bold: true,
          size: 24,
        }),
      ],
    }),
    new Paragraph({ text: '' })
  );

  // Sections
  (ws.sections || []).forEach((sec) => {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: sec.title,
            bold: true,
            size: 28,
            color: '0F172A',
          }),
        ],
      })
    );

    if (sec.instructions) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `คำชี้แจง: ${sec.instructions}`,
              italics: true,
              size: 22,
              color: '334155',
            }),
          ],
        })
      );
    }

    docChildren.push(new Paragraph({ text: '' }));

    (sec.questions || []).forEach((q, qIdx) => {
      const qNum = q.number || qIdx + 1;
      const qRuns: TextRun[] = [
        new TextRun({
          text: `${qNum}. ${q.question}`,
          bold: true,
          size: 24,
        }),
      ];

      if (q.score) {
        qRuns.push(
          new TextRun({
            text: ` (${q.score} คะแนน)`,
            size: 22,
            color: '64748B',
          })
        );
      }

      docChildren.push(new Paragraph({ children: qRuns }));

      // Code Snippet block
      if (q.codeSnippet) {
        q.codeSnippet.split('\n').forEach((line) => {
          docChildren.push(
            new Paragraph({
              indent: { left: 480 },
              children: [
                new TextRun({
                  text: line,
                  font: 'Courier New',
                  size: 22,
                  color: '0F172A',
                }),
              ],
            })
          );
        });
      }

      // Sub-items (if any)
      if (q.subItems && q.subItems.length > 0) {
        q.subItems.forEach((sub, sIdx) => {
          docChildren.push(
            new Paragraph({
              indent: { left: 480 },
              children: [
                new TextRun({
                  text: `${qNum}.${sIdx + 1}) ${sub.label}`,
                  bold: true,
                  size: 23,
                }),
              ],
            }),
            new Paragraph({
              indent: { left: 720 },
              children: [
                new TextRun({
                  text: 'ตอบ = ',
                  bold: true,
                  size: 23,
                }),
                new TextRun({
                  text:
                    includeAnswerKey && sub.answer
                      ? `${sub.answer}  ✓`
                      : '....................................................................................................................',
                  bold: includeAnswerKey,
                  color: includeAnswerKey ? '059669' : '334155',
                  size: 23,
                }),
              ],
            })
          );
        });
      } else {
        // Answer Space according to spaceType
        if (includeAnswerKey && q.answerKey) {
          docChildren.push(
            new Paragraph({
              indent: { left: 480 },
              children: [
                new TextRun({
                  text: `เฉลย / แนวคำตอบ: ${q.answerKey}`,
                  bold: true,
                  color: '059669',
                  size: 23,
                }),
              ],
            })
          );
        } else if (q.spaceType === 'blank') {
          docChildren.push(
            new Paragraph({
              indent: { left: 480 },
              children: [
                new TextRun({
                  text: 'ตอบ: ...........................................................................................................................',
                  size: 24,
                }),
              ],
            })
          );
        } else if (q.spaceType === 'box') {
          const boxLines = q.linesCount || 4;
          for (let i = 0; i < boxLines; i++) {
            docChildren.push(
              new Paragraph({
                indent: { left: 480 },
                children: [
                  new TextRun({
                    text: '__________________________________________________________________________________________',
                    color: '94A3B8',
                    size: 22,
                  }),
                ],
              })
            );
          }
        } else {
          const lineCount = q.linesCount || 2;
          for (let i = 0; i < lineCount; i++) {
            docChildren.push(
              new Paragraph({
                indent: { left: 480 },
                children: [
                  new TextRun({
                    text: '................................................................................................................................................',
                    color: '64748B',
                    size: 22,
                  }),
                ],
              })
            );
          }
        }
      }

      docChildren.push(new Paragraph({ text: '' }));
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

