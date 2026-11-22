'use client';

import React, { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';

interface MathToolbarProps {
  onInsertSymbol: (symbol: string) => void;
  className?: string;
}

export function MathToolbar({ onInsertSymbol, className = '' }: MathToolbarProps) {
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);

  const mathSymbols = [
    // Superscripts (เลขยกกำลัง)
    { label: 'x²', symbol: '²', title: 'ยกกำลัง 2' },
    { label: 'x³', symbol: '³', title: 'ยกกำลัง 3' },
    { label: 'x⁴', symbol: '⁴', title: 'ยกกำลัง 4' },
    { label: 'xⁿ', symbol: 'ⁿ', title: 'ยกกำลัง n' },
    { label: '10³', symbol: '10³', title: '10 ยกกำลัง 3' },
    { label: '10²', symbol: '10²', title: '10 ยกกำลัง 2' },
    { label: '10¹', symbol: '10¹', title: '10 ยกกำลัง 1' },
    { label: '10⁰', symbol: '10⁰', title: '10 ยกกำลัง 0' },

    // Subscripts (เลขฐาน)
    { label: 'x₁', symbol: '₁', title: 'ตัวห้อย 1' },
    { label: 'x₂', symbol: '₂', title: 'ตัวห้อย 2' },
    { label: 'x₁₀', symbol: '₁₀', title: 'ตัวห้อย 10' },

    // Math Operators
    { label: '×', symbol: '×', title: 'เครื่องหมายคูณ' },
    { label: '÷', symbol: '÷', title: 'เครื่องหมายหาร' },
    { label: '±', symbol: '±', title: 'บวกลบ' },
    { label: '√', symbol: '√', title: 'รากที่สอง (Square Root)' },
    { label: '≠', symbol: '≠', title: 'ไม่เท่ากับ' },
    { label: '≤', symbol: '≤', title: 'น้อยกว่าหรือเท่ากับ' },
    { label: '≥', symbol: '≥', title: 'มากกว่าหรือเท่ากับ' },
    { label: 'π', symbol: 'π', title: 'ค่าพาย' },
    { label: '°', symbol: '°', title: 'องศา' },

    // Sets & Logic
    { label: '∈', symbol: '∈', title: 'เป็นสมาชิกของ' },
    { label: '⊂', symbol: '⊂', title: 'เป็นสับเซตของ' },
    { label: '∪', symbol: '∪', title: 'ยูเนียน' },
    { label: '∩', symbol: '∩', title: 'อินเตอร์เซกชัน' },
  ];

  const handleClick = (symbol: string) => {
    onInsertSymbol(symbol);
    setCopiedSymbol(symbol);
    setTimeout(() => setCopiedSymbol(null), 1500);
  };

  return (
    <div className={`flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-100/90 border border-slate-200 rounded-2xl text-xs ${className}`}>
      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mr-1">
        <Sparkles className="w-3.5 h-3.5 text-purpleBrand-600" /> ใส่สัญลักษณ์:
      </span>
      {mathSymbols.map((item, idx) => (
        <button
          key={idx}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleClick(item.symbol)}
          className="px-2.5 py-1 bg-white hover:bg-purpleBrand-50 hover:text-purpleBrand-700 active:scale-95 text-slate-800 font-bold rounded-lg border border-slate-200/80 shadow-2xs hover:border-purpleBrand-300 transition text-xs flex items-center gap-1"
          title={item.title}
        >
          {item.label}
        </button>
      ))}
      {copiedSymbol && (
        <span className="ml-auto text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 animate-in fade-in">
          <Check className="w-3 h-3" /> แทรก '{copiedSymbol}' แล้ว
        </span>
      )}
    </div>
  );
}
