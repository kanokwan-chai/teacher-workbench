'use client';

import React from 'react';

export interface CuteIconProps {
  className?: string;
}

/** 1. Cute Laptop Logo with sparkle & leaf sprouts (Sidebar Top Logo) */
export function CuteLaptopLogo({ className = 'w-12 h-12' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Cute green leaf sprouts & yellow stars */}
      <path d="M12 46C7 44 5 39 8 36C11 33 15 37 14 43" fill="#4ADE80" stroke="#166534" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M53 14C56 10 60 11 59 15C58 18 54 19 52 17" fill="#4ADE80" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="55" cy="24" r="2.2" fill="#FACC15" />
      <circle cx="11" cy="20" r="2" fill="#A855F7" />
      <path d="M50 8L51 10.5L53.5 11.5L51 12.5L50 15L49 12.5L46.5 11.5L49 10.5L50 8Z" fill="#FACC15" />

      {/* Laptop Screen Frame */}
      <g transform="rotate(-6 32 32)">
        <rect x="13" y="13" width="38" height="27" rx="5" fill="#3B82F6" stroke="#1E293B" strokeWidth="2.4" />
        <rect x="16.5" y="16.5" width="31" height="20" rx="2.5" fill="url(#laptopScreenGrad)" />
        {/* Screen Gloss */}
        <path d="M18 18H31L22 35H18V18Z" fill="white" fillOpacity="0.18" />
        {/* Cute Python / Sparkle Emblem inside screen */}
        <rect x="27" y="21" width="10" height="6" rx="3" fill="#38BDF8" stroke="#1E293B" strokeWidth="1.5" />
        <circle cx="30" cy="23.5" r="1" fill="white" />
        <rect x="28" y="26" width="10" height="6" rx="3" fill="#FACC15" stroke="#1E293B" strokeWidth="1.5" />
        <circle cx="35" cy="29.5" r="1" fill="#1E293B" />

        {/* Laptop Keyboard Base */}
        <path d="M10 41L15 39H49L54 41C55.5 41.8 55 44.5 53 45L11 45C9 44.5 8.5 41.8 10 41Z" fill="#E2E8F0" stroke="#1E293B" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M11 45H53L51 49C50.5 50 49.5 50.5 48.2 50.5H15.8C14.5 50.5 13.5 50 13 49L11 45Z" fill="#94A3B8" stroke="#1E293B" strokeWidth="2" strokeLinejoin="round" />
        {/* Tiny keyboard dots */}
        <rect x="18" y="41.5" width="28" height="2" rx="1" fill="#64748B" />
      </g>
      <defs>
        <linearGradient id="laptopScreenGrad" x1="16" y1="16" x2="48" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E3A8A" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 2. Cute House Icon (Dashboard) */
export function CuteHouseIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Chimney */}
      <rect x="31" y="10" width="6" height="10" rx="2" fill="#FB923C" stroke="#334155" strokeWidth="2.2" />
      {/* House Body */}
      <path d="M10 22V39C10 40.6569 11.3431 42 13 42H35C36.6569 42 38 40.6569 38 39V22" fill="#FEF3C7" stroke="#334155" strokeWidth="2.4" strokeLinejoin="round" />
      {/* Roof */}
      <path d="M6 24L24 8L42 24" fill="#FB7185" stroke="#334155" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 23L24 9.5L39.5 23H8.5Z" fill="url(#roofGrad)" />
      {/* Cute Door */}
      <path d="M19 42V30C19 28.3431 20.3431 27 22 27H26C27.6569 27 29 28.3431 29 30V42H19Z" fill="#F59E0B" stroke="#334155" strokeWidth="2.2" />
      <circle cx="26" cy="35" r="1.4" fill="#FEF3C7" />
      {/* Little window */}
      <circle cx="24" cy="18.5" r="3" fill="#BAE6FD" stroke="#334155" strokeWidth="1.8" />
      <defs>
        <linearGradient id="roofGrad" x1="24" y1="9" x2="24" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDA4AF" />
          <stop offset="1" stopColor="#F43F5E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 3. Cute 3D Yellow Folder Icon (Hero & Exam Bank) */
export function CuteFolderIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Back Folder Plate */}
      <path d="M8 17C8 13.6863 10.6863 11 14 11H24.5C26.3 11 27.9 11.9 28.9 13.4L31 16.5H50C53.3137 16.5 56 19.1863 56 22.5V48C56 51.3137 53.3137 54 50 54H14C10.6863 54 8 51.3137 8 48V17Z" fill="#F59E0B" stroke="#334155" strokeWidth="2.6" strokeLinejoin="round" />
      {/* Papers Peeking Out */}
      <rect x="14" y="16" width="34" height="24" rx="4" fill="#E0F2FE" stroke="#334155" strokeWidth="2.2" />
      <rect x="18" y="20" width="32" height="22" rx="4" fill="#FFFFFF" stroke="#334155" strokeWidth="2.2" />
      <line x1="23" y1="26" x2="43" y2="26" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="23" y1="31" x2="38" y2="31" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
      {/* Front Folder Flap */}
      <path d="M6 27C6 24.7909 7.79086 23 10 23H54C56.2091 23 58 24.7909 58 27L55 50C54.6 52.3 52.6 54 50.2 54H13.8C11.4 54 9.4 52.3 9 50L6 27Z" fill="url(#folderFrontGrad)" stroke="#334155" strokeWidth="2.6" strokeLinejoin="round" />
      {/* Gloss Highlight */}
      <path d="M11 27H53" stroke="white" strokeOpacity="0.65" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="folderFrontGrad" x1="32" y1="23" x2="32" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 4. Cute Worksheet Document Icon */
export function CuteWorksheetIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M11 7C11 5.34315 12.3431 4 14 4H29L39 14V41C39 42.6569 37.6569 44 36 44H14C12.3431 44 11 42.6569 11 41V7Z" fill="url(#docBlueGrad)" stroke="#334155" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M29 4V12C29 13.1046 29.8954 14 31 14H39L29 4Z" fill="#BAE6FD" stroke="#334155" strokeWidth="2.2" strokeLinejoin="round" />
      <rect x="16" y="18" width="16" height="3.2" rx="1.6" fill="#3B82F6" />
      <rect x="16" y="25" width="16" height="2.8" rx="1.4" fill="#93C5FD" />
      <rect x="16" y="31" width="11" height="2.8" rx="1.4" fill="#93C5FD" />
      <defs>
        <linearGradient id="docBlueGrad" x1="25" y1="4" x2="25" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E0F2FE" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 5. Kawaii Smiling AI Robot Icon (AI Exam Generator) */
export function CuteRobotIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Antenna */}
      <line x1="32" y1="16" x2="32" y2="9" stroke="#334155" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="32" cy="8" r="3.5" fill="#F472B6" stroke="#334155" strokeWidth="2.2" />
      {/* Sparkles */}
      <path d="M52 12L53.2 15L56 16.2L53.2 17.4L52 20.4L50.8 17.4L48 16.2L50.8 15L52 12Z" fill="#A855F7" />
      <circle cx="12" cy="17" r="2.2" fill="#38BDF8" />
      {/* Ears */}
      <rect x="8" y="28" width="6" height="12" rx="3" fill="#A78BFA" stroke="#334155" strokeWidth="2.4" />
      <rect x="50" y="28" width="6" height="12" rx="3" fill="#A78BFA" stroke="#334155" strokeWidth="2.4" />
      {/* Robot Head */}
      <rect x="13" y="17" width="38" height="31" rx="13" fill="url(#robotBodyGrad)" stroke="#334155" strokeWidth="2.6" />
      {/* Face Visor */}
      <rect x="18" y="23" width="28" height="18" rx="8" fill="#1E1B4B" stroke="#334155" strokeWidth="2" />
      {/* Happy Eyes */}
      <path d="M23.5 31.5C24.3 29.2 27.2 29.2 28 31.5" stroke="#67E8F9" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M36 31.5C36.8 29.2 39.7 29.2 40.5 31.5" stroke="#67E8F9" strokeWidth="2.8" strokeLinecap="round" />
      {/* Rosy Cheeks */}
      <ellipse cx="22.5" cy="35" rx="2.5" ry="1.5" fill="#F472B6" fillOpacity="0.85" />
      <ellipse cx="41.5" cy="35" rx="2.5" ry="1.5" fill="#F472B6" fillOpacity="0.85" />
      {/* Cute Smile */}
      <path d="M29.5 35.5C30.8 37.2 33.2 37.2 34.5 35.5" stroke="#FDE047" strokeWidth="2.2" strokeLinecap="round" />
      {/* Tiny Neck / Base */}
      <path d="M22 48H42L45 55C45 56.5 43.8 57.5 42.3 57.5H21.7C20.2 57.5 19 56.5 19 55L22 48Z" fill="#C4B5FD" stroke="#334155" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="32" cy="53" r="2.2" fill="#38BDF8" />
      <defs>
        <linearGradient id="robotBodyGrad" x1="32" y1="17" x2="32" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DDD6FE" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 6. Cute Answer Sheet Icon (OMR / Bubble Sheet) */
export function CuteAnswerSheetIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="5" width="30" height="38" rx="5" fill="url(#omrGrad)" stroke="#334155" strokeWidth="2.4" />
      <rect x="14" y="10" width="20" height="4" rx="2" fill="#8B5CF6" />
      {/* Bubble rows */}
      <circle cx="16.5" cy="20" r="2.3" fill="#A78BFA" stroke="#334155" strokeWidth="1.4" />
      <circle cx="24" cy="20" r="2.3" fill="white" stroke="#64748B" strokeWidth="1.4" />
      <circle cx="31.5" cy="20" r="2.3" fill="white" stroke="#64748B" strokeWidth="1.4" />

      <circle cx="16.5" cy="28" r="2.3" fill="white" stroke="#64748B" strokeWidth="1.4" />
      <circle cx="24" cy="28" r="2.3" fill="#34D399" stroke="#334155" strokeWidth="1.4" />
      <circle cx="31.5" cy="28" r="2.3" fill="white" stroke="#64748B" strokeWidth="1.4" />

      <circle cx="16.5" cy="36" r="2.3" fill="white" stroke="#64748B" strokeWidth="1.4" />
      <circle cx="24" cy="36" r="2.3" fill="white" stroke="#64748B" strokeWidth="1.4" />
      <circle cx="31.5" cy="36" r="2.3" fill="#F472B6" stroke="#334155" strokeWidth="1.4" />
      <defs>
        <linearGradient id="omrGrad" x1="24" y1="5" x2="24" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F3E8FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 7. Cute Colorful Books Stack (Content Library) */
export function CuteBooksIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="10" width="11" height="32" rx="3" fill="#4ADE80" stroke="#334155" strokeWidth="2.3" />
      <line x1="10" y1="16" x2="15" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <rect x="18" y="7" width="12" height="35" rx="3" fill="#FB7185" stroke="#334155" strokeWidth="2.3" />
      <line x1="21.5" y1="14" x2="26.5" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <rect x="30" y="12" width="11" height="30" rx="3" fill="#60A5FA" stroke="#334155" strokeWidth="2.3" />
      <line x1="33" y1="18" x2="38" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 8. Cute Glossy Red PDF Icon */
export function CutePdfRedIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 56 56" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8C12 5.79086 13.7909 4 16 4H34L45 15V48C45 50.2091 43.2091 52 41 52H16C13.7909 52 12 50.2091 12 48V8Z" fill="url(#pdfRedGrad)" stroke="#334155" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M34 4V13C34 14.1046 34.8954 15 36 15H45L34 4Z" fill="#FECDD3" stroke="#334155" strokeWidth="2.4" strokeLinejoin="round" />
      {/* White Gloss */}
      <path d="M16 9V20" stroke="white" strokeOpacity="0.45" strokeWidth="2.4" strokeLinecap="round" />
      {/* PDF Pill */}
      <rect x="15" y="25" width="27" height="15" rx="4.5" fill="white" fillOpacity="0.95" />
      <text x="28.5" y="36" textAnchor="middle" fill="#E11D48" fontSize="10.5" fontWeight="800" fontFamily="Prompt, sans-serif">
        PDF
      </text>
      <defs>
        <linearGradient id="pdfRedGrad" x1="28" y1="4" x2="28" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6B81" />
          <stop offset="1" stopColor="#E11D48" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 9. Cute Image -> PDF Icon */
export function CuteImgToPdfIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 56 56" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Back Photo */}
      <rect x="13" y="8" width="33" height="27" rx="5" transform="rotate(6 30 22)" fill="#FDE047" stroke="#334155" strokeWidth="2.4" />
      {/* Front Landscape Photo */}
      <rect x="8" y="14" width="36" height="30" rx="6" fill="url(#skyPhotoGrad)" stroke="#334155" strokeWidth="2.6" />
      {/* Sun */}
      <circle cx="18" cy="23" r="4" fill="#FDE047" stroke="#334155" strokeWidth="1.6" />
      {/* Mountains */}
      <path d="M10 42L21 29L29 37L35 31L43 42H10Z" fill="#4ADE80" stroke="#334155" strokeWidth="2" strokeLinejoin="round" />
      <path d="M27 42L35 31L43 42H27Z" fill="#22C55E" />
      <defs>
        <linearGradient id="skyPhotoGrad" x1="26" y1="14" x2="26" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BAE6FD" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 10. Cute PDF to Image Icon (Sidebar) */
export function CutePdfToImgIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="6" width="24" height="30" rx="4" fill="#FFFFFF" stroke="#334155" strokeWidth="2.2" />
      <rect x="10" y="10" width="18" height="12" rx="2.5" fill="#7DD3FC" />
      <path d="M11 22L16 16L20 20L24 17L27 22H11Z" fill="#4ADE80" />
      {/* Red PDF badge overlapping */}
      <rect x="18" y="24" width="23" height="16" rx="4" fill="#F43F5E" stroke="#334155" strokeWidth="2.2" />
      <text x="29.5" y="35.5" textAnchor="middle" fill="white" fontSize="8.5" fontWeight="800" fontFamily="Prompt, sans-serif">
        PDF
      </text>
    </svg>
  );
}

/** 11. Cute Purple/Blue Scissors Icon (Split PDF) */
export function CuteScissorsIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 56 56" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Blades */}
      <path d="M21 25L44 12C46 11 47.5 13.5 46 15.5L26 30" fill="#CBD5E1" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 31L44 44C46 45 47.5 42.5 46 40.5L26 26" fill="#E2E8F0" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Cute Handles */}
      <circle cx="16" cy="18" r="8" fill="#A78BFA" stroke="#334155" strokeWidth="2.6" />
      <circle cx="16" cy="18" r="3.8" fill="#F5F3FF" stroke="#334155" strokeWidth="2" />
      <circle cx="16" cy="38" r="8" fill="#60A5FA" stroke="#334155" strokeWidth="2.6" />
      <circle cx="16" cy="38" r="3.8" fill="#EFF6FF" stroke="#334155" strokeWidth="2" />
      {/* Center Screw */}
      <circle cx="28" cy="28" r="3" fill="#FDE047" stroke="#334155" strokeWidth="2" />
    </svg>
  );
}

/** 12. Cute Glossy Coral Trash Icon (Delete PDF) */
export function CuteTrashIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 56 56" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Handle */}
      <path d="M22 12V9C22 7.34315 23.3431 6 25 6H31C32.6569 6 34 7.34315 34 9V12" stroke="#334155" strokeWidth="2.6" strokeLinecap="round" />
      {/* Lid */}
      <rect x="10" y="12" width="36" height="7" rx="3.5" fill="#FB7185" stroke="#334155" strokeWidth="2.5" />
      {/* Bin Body */}
      <path d="M14 19H42L39.5 46C39.2 48.5 37.1 50 34.6 50H21.4C18.9 50 16.8 48.5 16.5 46L14 19Z" fill="url(#trashGrad)" stroke="#334155" strokeWidth="2.6" strokeLinejoin="round" />
      {/* Vertical Stripes */}
      <line x1="22" y1="26" x2="23" y2="43" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="28" y1="26" x2="28" y2="43" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="34" y1="26" x2="33" y2="43" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      <defs>
        <linearGradient id="trashGrad" x1="28" y1="19" x2="28" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6B81" />
          <stop offset="1" stopColor="#E11D48" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 13. Cute Cyan OCR Scanner Icon */
export function CuteOcrIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 56 56" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Scanner Corner Brackets */}
      <path d="M8 18V12C8 9.8 9.8 8 12 8H18" stroke="#0EA5E9" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M38 8H44C46.2 8 48 9.8 48 12V18" stroke="#0EA5E9" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M48 38V44C48 46.2 46.2 48 44 48H38" stroke="#0EA5E9" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M18 48H12C9.8 48 8 46.2 8 44V38" stroke="#0EA5E9" strokeWidth="3.5" strokeLinecap="round" />
      {/* Inner Badge */}
      <rect x="13" y="15" width="30" height="26" rx="7" fill="url(#ocrGrad)" stroke="#334155" strokeWidth="2.4" />
      <text x="28" y="32" textAnchor="middle" fill="white" fontSize="11.5" fontWeight="800" fontFamily="Prompt, sans-serif">
        OCR
      </text>
      {/* Cute Scan Beam */}
      <line x1="11" y1="28" x2="45" y2="28" stroke="#FDE047" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
      <defs>
        <linearGradient id="ocrGrad" x1="28" y1="15" x2="28" y2="41" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 14. Cute Merge PDF Icon (Mint + Coral Docs) */
export function CuteMergePdfIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 56 56" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Green Doc */}
      <rect x="9" y="8" width="27" height="35" rx="5" fill="url(#mergeGreenGrad)" stroke="#334155" strokeWidth="2.5" />
      <line x1="15" y1="17" x2="29" y2="17" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="15" y1="23" x2="26" y2="23" stroke="white" strokeOpacity="0.8" strokeWidth="2.5" strokeLinecap="round" />
      {/* Overlapping Pink Doc */}
      <rect x="24" y="18" width="23" height="30" rx="5" fill="#FFF1F2" stroke="#334155" strokeWidth="2.5" />
      <rect x="28" y="25" width="15" height="6" rx="2.5" fill="#FB7185" />
      <line x1="29" y1="36" x2="42" y2="36" stroke="#FDA4AF" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="29" y1="41" x2="38" y2="41" stroke="#FDA4AF" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="mergeGreenGrad" x1="22" y1="8" x2="22" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ADE80" />
          <stop offset="1" stopColor="#16A34A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 15. Cute Settings Gear Icon */
export function CuteGearIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20.5 6.5C21 5 22.4 4 24 4C25.6 4 27 5 27.5 6.5L28.3 9.2C29.5 9.6 30.6 10.1 31.6 10.8L34.2 9.5C35.6 8.8 37.3 9.1 38.4 10.2C39.5 11.3 39.8 13 39.1 14.4L37.8 17C38.5 18 39 19.1 39.4 20.3L42.1 21.1C43.6 21.6 44.6 23 44.6 24.6C44.6 26.2 43.6 27.6 42.1 28.1L39.4 28.9C39 30.1 38.5 31.2 37.8 32.2L39.1 34.8C39.8 36.2 39.5 37.9 38.4 39C37.3 40.1 35.6 40.4 34.2 39.7L31.6 38.4C30.6 39.1 29.5 39.6 28.3 40L27.5 42.7C27 44.2 25.6 45.2 24 45.2C22.4 45.2 21 44.2 20.5 42.7L19.7 40C18.5 39.6 17.4 39.1 16.4 38.4L13.8 39.7C12.4 40.4 10.7 40.1 9.6 39C8.5 37.9 8.2 36.2 8.9 34.8L10.2 32.2C9.5 31.2 9 30.1 8.6 28.9L5.9 28.1C4.4 27.6 3.4 26.2 3.4 24.6C3.4 23 4.4 21.6 5.9 21.1L8.6 20.3C9 19.1 9.5 18 10.2 17L8.9 14.4C8.2 13 8.5 11.3 9.6 10.2C10.7 9.1 12.4 8.8 13.8 9.5L16.4 10.8C17.4 10.1 18.5 9.6 19.7 9.2L20.5 6.5Z"
        fill="url(#gearGrad)"
        stroke="#334155"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24.6" r="7" fill="#EFF6FF" stroke="#334155" strokeWidth="2.4" />
      <defs>
        <linearGradient id="gearGrad" x1="24" y1="4" x2="24" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93C5FD" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 16. Cute Teacher Avatar (Sidebar Profile Card) */
export function CuteTeacherAvatar({ className = 'w-11 h-11' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="url(#avatarBg)" stroke="#E0E7FF" strokeWidth="2" />
      {/* Hair Back */}
      <path d="M16 32C16 19 22 12 32 12C42 12 48 19 48 32V44C48 47 45 50 42 50H22C19 50 16 47 16 44V32Z" fill="#7C4A33" stroke="#334155" strokeWidth="2" />
      {/* Shoulders / Pastel Sweater */}
      <path d="M15 58C16 49 23 45 32 45C41 45 48 49 49 58" fill="#A78BFA" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M27 46L32 51L37 46" fill="#FFFFFF" stroke="#334155" strokeWidth="1.6" strokeLinejoin="round" />
      {/* Face */}
      <circle cx="32" cy="31" r="12.5" fill="#FFE0C8" stroke="#334155" strokeWidth="2" />
      {/* Bangs */}
      <path d="M19.5 28C21 19 27 16 32 16C38 16 43 20 44.5 28C41 25 38 24 34 25C30 26 25 25 19.5 28Z" fill="#8D553A" stroke="#334155" strokeWidth="1.8" strokeLinejoin="round" />
      {/* Cute Eyes */}
      <circle cx="27" cy="32" r="1.8" fill="#1E293B" />
      <circle cx="37" cy="32" r="1.8" fill="#1E293B" />
      <circle cx="26.5" cy="31.3" r="0.6" fill="white" />
      <circle cx="36.5" cy="31.3" r="0.6" fill="white" />
      {/* Rosy Cheeks */}
      <ellipse cx="23.5" cy="35" rx="2.5" ry="1.4" fill="#FDA4AF" />
      <ellipse cx="40.5" cy="35" rx="2.5" ry="1.4" fill="#FDA4AF" />
      {/* Warm Smile */}
      <path d="M29 36.5C30.5 38.5 33.5 38.5 35 36.5" stroke="#BE185D" strokeWidth="1.8" strokeLinecap="round" />
      <defs>
        <linearGradient id="avatarBg" x1="32" y1="2" x2="32" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0F2FE" />
          <stop offset="1" stopColor="#F3E8FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 17. Cute 3D Gold Star */
export function CuteStarIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 4L24.9 13.8L35.7 15.4L27.8 23.1L29.7 33.9L20 28.8L10.3 33.9L12.2 23.1L4.3 15.4L15.1 13.8L20 4Z"
        fill="url(#starGoldGrad)"
        stroke="#B45309"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M18 11L15.5 16L11 17" stroke="white" strokeOpacity="0.65" strokeWidth="2" strokeLinecap="round" />
      <defs>
        <linearGradient id="starGoldGrad" x1="20" y1="4" x2="20" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF08A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 18. Cute Clipboard Icon (My Work) */
export function CuteClipboardIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="7" width="26" height="30" rx="5" fill="#FDBA74" stroke="#334155" strokeWidth="2.2" />
      <rect x="11" y="11" width="18" height="22" rx="2.5" fill="white" stroke="#334155" strokeWidth="1.6" />
      <rect x="14" y="4" width="12" height="6" rx="2.5" fill="#94A3B8" stroke="#334155" strokeWidth="2" />
      <line x1="14.5" y1="17" x2="25.5" y2="17" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="14.5" y1="22.5" x2="25.5" y2="22.5" stroke="#A78BFA" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="14.5" y1="28" x2="21.5" y2="28" stroke="#CBD5E1" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** 19. Cute Glossy Plus Icon (Create New) */
export function CutePlusSparkleIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.5 7C16.5 5.34315 17.8431 4 19.5 4H20.5C22.1569 4 23.5 5.34315 23.5 7V16.5H33C34.6569 16.5 36 17.8431 36 19.5V20.5C36 22.1569 34.6569 23.5 33 23.5H23.5V33C23.5 34.6569 22.1569 36 20.5 36H19.5C17.8431 36 16.5 34.6569 16.5 33V23.5H7C5.34315 23.5 4 22.1569 4 20.5V19.5C4 17.8431 5.34315 16.5 7 16.5H16.5V7Z"
        fill="url(#plusGoldGrad)"
        stroke="#B45309"
        strokeWidth="2.2"
      />
      <defs>
        <linearGradient id="plusGoldGrad" x1="20" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF08A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 20. Cute Bar Chart Icon (Stats Overview) */
export function CuteChartIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="20" width="7.5" height="14" rx="2.5" fill="#4ADE80" stroke="#334155" strokeWidth="2.1" />
      <rect x="16.2" y="13" width="7.5" height="21" rx="2.5" fill="#FB923C" stroke="#334155" strokeWidth="2.1" />
      <rect x="26.5" y="7" width="7.5" height="27" rx="2.5" fill="#38BDF8" stroke="#334155" strokeWidth="2.1" />
    </svg>
  );
}

/** 21. Cute Clock Icon (Recent Activity) */
export function CuteClockIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="15" fill="url(#clockGrad)" stroke="#334155" strokeWidth="2.3" />
      <circle cx="20" cy="20" r="11" fill="#FFFBEB" />
      <path d="M20 13V20L24.5 23" stroke="#EA580C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="2" fill="#334155" />
      <defs>
        <linearGradient id="clockGrad" x1="20" y1="5" x2="20" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 22. Cute Megaphone Icon (Recommended Tool) */
export function CuteMegaphoneIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M11 23L14 33C14.3 34 15.4 34.5 16.4 34.2L19 33.4C20 33.1 20.5 32 20.2 31L17.5 22" fill="#38BDF8" stroke="#334155" strokeWidth="2.1" strokeLinejoin="round" />
      <path d="M8 17C8 15.3 9.3 14 11 14H17L30 8V30L17 24H11C9.3 24 8 22.7 8 21V17Z" fill="url(#megaGrad)" stroke="#334155" strokeWidth="2.2" strokeLinejoin="round" />
      <ellipse cx="30" cy="19" rx="3" ry="11" fill="#FDE047" stroke="#334155" strokeWidth="2.1" />
      <path d="M35.5 14.5L38 12.5M36 19H39M35.5 23.5L38 25.5" stroke="#FB923C" strokeWidth="2.2" strokeLinecap="round" />
      <defs>
        <linearGradient id="megaGrad" x1="19" y1="8" x2="19" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDBA74" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 23. Cute Glowing Lightbulb Icon */
export function CuteLightbulbIcon({ className = 'w-10 h-10' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 56 56" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Glow Rays */}
      <path d="M28 5V9M11 12L14 15M45 12L42 15M7 26H11M45 26H49" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" />
      {/* Bulb */}
      <path d="M16 25C16 18.4 21.4 13 28 13C34.6 13 40 18.4 40 25C40 29.4 37.6 33.2 34 35.3V39C34 40.7 32.7 42 31 42H25C23.3 42 22 40.7 22 39V35.3C18.4 33.2 16 29.4 16 25Z" fill="url(#bulbGrad)" stroke="#334155" strokeWidth="2.4" strokeLinejoin="round" />
      {/* Shine */}
      <path d="M21 22C21.8 19.5 24 17.8 26.5 17.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      {/* Base */}
      <rect x="22" y="42" width="12" height="5" rx="2.5" fill="#94A3B8" stroke="#334155" strokeWidth="2.2" />
      <path d="M25 47H31L30 50H26L25 47Z" fill="#64748B" stroke="#334155" strokeWidth="2" strokeLinejoin="round" />
      <defs>
        <linearGradient id="bulbGrad" x1="28" y1="13" x2="28" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF08A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 24. Cute Open Book Illustration (Featured Banner) */
export function CuteOpenBookIcon({ className = 'w-28 h-20' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 112 72" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Sparkles */}
      <circle cx="24" cy="14" r="3" fill="#FDE047" />
      <circle cx="88" cy="16" r="2.5" fill="#A78BFA" />
      <path d="M56 6L57.5 10L61.5 11.5L57.5 13L56 17L54.5 13L50.5 11.5L54.5 10L56 6Z" fill="#38BDF8" />
      {/* Cover Base */}
      <path d="M12 56C12 54 14 52 17 52H95C98 52 100 54 100 56L103 61C103 63 101 64 98 64H14C11 64 9 63 9 61L12 56Z" fill="#3B82F6" stroke="#334155" strokeWidth="2.4" strokeLinejoin="round" />
      {/* Green & Orange Ribbon Bookmarks */}
      <path d="M20 58L25 65L30 58" fill="#4ADE80" stroke="#334155" strokeWidth="1.8" />
      <path d="M80 58L85 65L90 58" fill="#FB923C" stroke="#334155" strokeWidth="1.8" />
      {/* Left Pages */}
      <path d="M16 53L22 25C22 23 24 22 26 22C38 22 49 25 56 32V56C47 51 31 51 16 53Z" fill="url(#bookPageL)" stroke="#334155" strokeWidth="2.4" strokeLinejoin="round" />
      {/* Right Pages */}
      <path d="M96 53L90 25C90 23 88 22 86 22C74 22 63 25 56 32V56C65 51 81 51 96 53Z" fill="url(#bookPageR)" stroke="#334155" strokeWidth="2.4" strokeLinejoin="round" />
      {/* Text Lines */}
      <path d="M28 31C35 31 43 32.5 48 35" stroke="#93C5FD" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M26 38C34 38 42 39.5 48 42" stroke="#CBD5E1" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M84 31C77 31 69 32.5 64 35" stroke="#C4B5FD" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M86 38C78 38 70 39.5 64 42" stroke="#CBD5E1" strokeWidth="2.4" strokeLinecap="round" />
      <defs>
        <linearGradient id="bookPageL" x1="36" y1="22" x2="36" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E0F2FE" />
        </linearGradient>
        <linearGradient id="bookPageR" x1="76" y1="22" x2="76" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F3E8FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 25. Cute Blue Folder Stat Icon */
export function CuteBlueFolderStatIcon({ className = 'w-9 h-9' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M6 14C6 11.8 7.8 10 10 10H19L23 14H38C40.2 14 42 15.8 42 18V36C42 38.2 40.2 40 38 40H10C7.8 40 6 38.2 6 36V14Z" fill="#0284C7" stroke="#334155" strokeWidth="2.3" />
      <path d="M5 21C5 19.3 6.3 18 8 18H40C41.7 18 43 19.3 43 21L41 37C40.7 38.7 39.3 40 37.5 40H10.5C8.7 40 7.3 38.7 7 37L5 21Z" fill="url(#blueFolderGrad)" stroke="#334155" strokeWidth="2.3" />
      <defs>
        <linearGradient id="blueFolderGrad" x1="24" y1="18" x2="24" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7DD3FC" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 26. Cute Green Check Stat Icon */
export function CuteCheckGreenIcon({ className = 'w-9 h-9' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="7" width="34" height="34" rx="10" fill="url(#checkGreenGrad)" stroke="#334155" strokeWidth="2.4" />
      <path d="M16 24.5L21.8 30.2L33 18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="checkGreenGrad" x1="24" y1="7" x2="24" y2="41" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ADE80" />
          <stop offset="1" stopColor="#16A34A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 27. Cute Orange People / Classroom Stat Icon */
export function CutePeopleOrangeIcon({ className = 'w-9 h-9' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Right person */}
      <circle cx="31.5" cy="17" r="6" fill="#FDE047" stroke="#334155" strokeWidth="2.2" />
      <path d="M23 37C23 31.5 26.8 27 31.5 27C36.2 27 40 31.5 40 37V39H23V37Z" fill="#FB923C" stroke="#334155" strokeWidth="2.2" strokeLinejoin="round" />
      {/* Left person */}
      <circle cx="18" cy="15.5" r="7" fill="#FDBA74" stroke="#334155" strokeWidth="2.2" />
      <path d="M8 38C8 31.8 12.5 27 18 27C23.5 27 28 31.8 28 38V40H8V38Z" fill="url(#orangePeopleGrad)" stroke="#334155" strokeWidth="2.2" strokeLinejoin="round" />
      <defs>
        <linearGradient id="orangePeopleGrad" x1="18" y1="27" x2="18" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB923C" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 28. Cute Notification Bell Icon */
export function CuteBellIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M16 31C16.8 33 18.3 34 20 34C21.7 34 23.2 33 24 31" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 7C14 7 10 11.5 10 17.5V23.5L7.5 27.5C7 28.4 7.6 29.5 8.7 29.5H31.3C32.4 29.5 33 28.4 32.5 27.5L30 23.5V17.5C30 11.5 26 7 20 7Z" fill="url(#bellGrad)" stroke="#334155" strokeWidth="2.3" strokeLinejoin="round" />
      <circle cx="20" cy="6.5" r="2.2" fill="#A78BFA" stroke="#334155" strokeWidth="1.8" />
      <defs>
        <linearGradient id="bellGrad" x1="20" y1="7" x2="20" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0E7FF" />
          <stop offset="1" stopColor="#818CF8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 29. Cute Create Action Icon with Purple Plus Badge */
export function CuteCreateTileIcon({
  variant,
  className = 'w-14 h-14',
}: {
  variant: 'worksheet' | 'exam' | 'answer';
  className?: string;
}) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {variant === 'worksheet' && <CuteWorksheetIcon className="w-full h-full drop-shadow-sm" />}
      {variant === 'exam' && <CuteClipboardIcon className="w-full h-full drop-shadow-sm" />}
      {variant === 'answer' && <CuteAnswerSheetIcon className="w-full h-full drop-shadow-sm" />}
      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-[#a855f7] to-[#7c3aed] text-white flex items-center justify-center shadow-md border-2 border-white text-sm font-extrabold leading-none">
        +
      </span>
    </div>
  );
}

/** 30. Cute Printer Icon */
export function CutePrinterIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="13" y="7" width="22" height="12" rx="2.5" fill="#FFFFFF" stroke="#334155" strokeWidth="2.2" />
      <rect x="6" y="17" width="36" height="17" rx="5" fill="#60A5FA" stroke="#334155" strokeWidth="2.4" />
      <circle cx="35" cy="23" r="2" fill="#4ADE80" />
      <rect x="13" y="27" width="22" height="14" rx="2.5" fill="#FFFFFF" stroke="#334155" strokeWidth="2.2" />
      <line x1="17" y1="32" x2="31" y2="32" stroke="#93C5FD" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="17" y1="36.5" x2="26" y2="36.5" stroke="#CBD5E1" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** 31. Cute Compress Package Icon */
export function CuteCompressIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="32" height="30" rx="6" fill="url(#boxOrangeGrad)" stroke="#334155" strokeWidth="2.4" />
      <path d="M8 18H40" stroke="#334155" strokeWidth="2.2" />
      <rect x="20" y="10" width="8" height="15" rx="2" fill="#FEF3C7" stroke="#334155" strokeWidth="2" />
      <defs>
        <linearGradient id="boxOrangeGrad" x1="24" y1="10" x2="24" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDBA74" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 32. Cute Shuffle Exam Icon */
export function CuteShuffleIcon({ className = 'w-6 h-6' }: CuteIconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="36" height="36" rx="11" fill="url(#shuffleGrad)" stroke="#334155" strokeWidth="2.3" />
      <path d="M14 18H20L28 30H34" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31 26.5L34.5 30L31 33.5" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 30H20L28 18H34" stroke="#FEF08A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31 14.5L34.5 18L31 21.5" stroke="#FEF08A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="shuffleGrad" x1="24" y1="6" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
