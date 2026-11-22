'use client';

import React from 'react';

interface FormattedMathTextProps {
  text: string;
  className?: string;
}

/**
 * Reusable component to render math text with superscripts (เลขยกกำลัง),
 * subscripts (เลขฐาน), and special math symbols (×, ÷, ±, √, ⊂, ∪, ∩).
 */
export function FormattedMathText({ text, className = '' }: FormattedMathTextProps) {
  if (!text) return null;

  // Convert common caret ^ notation (e.g. 10^3 or x^2) into HTML superscripts
  // and underscore _ notation (e.g. log_2 or 10_2) into HTML subscripts
  // Also replace unprintable box replacement characters or raw asterisks
  const formattedHtml = parseMathToHtml(text);

  return (
    <span
      className={`inline-block font-sans ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
}

export function parseMathToHtml(input: string): string {
  if (!input) return '';

  let str = input;

  // Replace unprintable box symbol or weird replacement chars with multiplication or space if needed
  str = str.replace(/☐/g, '×');

  // Replace * with multiplication sign × when between numbers or variables
  str = str.replace(/(\d)\s*\*\s*(\d)/g, '$1 × $2');

  // Handle caret superscripts e.g., 10^3 -> 10<sup>3</sup>, x^(n+1) -> x<sup>n+1</sup>
  str = str.replace(/\^([0-9a-zA-Z\+\-]+)/g, '<sup>$1</sup>');
  str = str.replace(/\^\(([^)]+)\)/g, '<sup>$1</sup>');

  // Handle underscore subscripts e.g., log_2 -> log<sub>2</sub>, 10_2 -> 10<sub>2</sub>
  str = str.replace(/_([0-9a-zA-Z\+\-]+)/g, '<sub>$1</sub>');
  str = str.replace(/_\(([^)]+)\)/g, '<sub>$1</sub>');

  return str;
}

// Superscript Unicode mapping helper
export const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ'
};

// Subscript Unicode mapping helper
export const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ'
};

export function toSuperscript(str: string): string {
  return str.split('').map((char) => SUPERSCRIPT_MAP[char] || char).join('');
}

export function toSubscript(str: string): string {
  return str.split('').map((char) => SUBSCRIPT_MAP[char] || char).join('');
}
