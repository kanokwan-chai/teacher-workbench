'use client';

import React, { useState, useEffect } from 'react';

export interface QuotaNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorType?: 'RATE_LIMIT' | 'QUOTA_EXCEEDED' | 'TOKEN_LIMIT' | 'API_KEY_MISSING' | 'UNKNOWN';
  errorMessage?: string;
  retryAfterSeconds?: number;
  onRetry?: () => void;
}

export const QuotaNoticeModal: React.FC<QuotaNoticeModalProps> = ({
  isOpen,
  onClose,
  errorType = 'RATE_LIMIT',
  errorMessage,
  retryAfterSeconds = 60,
  onRetry,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(retryAfterSeconds);
  const [isResetComplete, setIsResetComplete] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const initialSeconds = retryAfterSeconds > 0 ? retryAfterSeconds : 60;
    setTimeLeft(initialSeconds);
    setIsResetComplete(false);

    if (errorType === 'API_KEY_MISSING' || errorType === 'TOKEN_LIMIT') {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsResetComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, retryAfterSeconds, errorType]);

  if (!isOpen) return null;

  const totalSeconds = retryAfterSeconds > 0 ? retryAfterSeconds : 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalSeconds - timeLeft) / totalSeconds) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className={`p-6 text-white ${
          isResetComplete 
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600' 
            : errorType === 'QUOTA_EXCEEDED' || errorType === 'RATE_LIMIT'
            ? 'bg-gradient-to-r from-amber-500 to-orange-600'
            : 'bg-gradient-to-r from-rose-600 to-pink-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                {isResetComplete ? (
                  <svg className="w-7 h-7 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {isResetComplete 
                    ? 'ระบบพร้อมใช้งานแล้ว!' 
                    : errorType === 'RATE_LIMIT' 
                    ? 'แจ้งเตือน: โควตา Gemini API ชั่วคราวเต็ม'
                    : errorType === 'QUOTA_EXCEEDED'
                    ? 'แจ้งเตือน: โควตาการใช้งานรายวันเต็ม'
                    : errorType === 'TOKEN_LIMIT'
                    ? 'ข้อความยาวเกินขีดจำกัด (Token Limit)'
                    : 'เกิดข้อผิดพลาดในการเรียกใช้ API'}
                </h3>
                <p className="text-xs text-white/90 font-medium">
                  {isResetComplete ? 'โควตารีเซ็ตเรียบร้อย สามารถลองใหม่อีกครั้งได้เลย' : 'Gemini API Rate Limit & Quota Monitor'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300">
            {errorMessage || (
              errorType === 'RATE_LIMIT'
                ? 'มีการส่งคำสั่งถี่เกินไปชั่วคราว ทำให้ Gemini API ชะลอการตอบกลับ เพื่อความเสถียรของระบบ'
                : errorType === 'QUOTA_EXCEEDED'
                ? 'โควตาใช้งาน Gemini API ประจำวันเต็มแล้ว ระบบจะพร้อมใช้งานใหม่เมื่อพ้นช่วงเวลารีเซ็ต'
                : 'เกิดข้อผิดพลาดในการประมวลผล'
            )}
          </div>

          {/* Countdown Section for Rate Limit / Quota */}
          {(errorType === 'RATE_LIMIT' || errorType === 'QUOTA_EXCEEDED') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  <svg className={`w-4 h-4 ${!isResetComplete ? 'animate-spin text-amber-500' : 'text-emerald-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{isResetComplete ? 'การนับถอยหลังเสร็จสิ้น' : 'นับถอยหลังการรีเซ็ตโควตา:'}</span>
                </span>
                <span className={`text-base font-bold ${isResetComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {isResetComplete ? 'พร้อมทำงาน!' : `เหลืออีก ${timeLeft} วินาที`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                    isResetComplete 
                      ? 'bg-emerald-500' 
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                  style={{ width: `${isResetComplete ? 100 : progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Guidelines */}
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">💡 คำแนะนำ:</p>
            {isResetComplete ? (
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                กดปุ่ม <strong>"ลองใหม่อีกครั้ง"</strong> ด้านล่างเพื่อส่งคำสั่งให้ Gemini API ประมวลผลอีกครั้ง
              </p>
            ) : (
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>คุณครูสามารถเปิดหน้าต่างนี้ไว้ ระบบจะรีเซ็ตให้อัตโนมัติเมื่อครบเวลา</li>
                <li>หากใช้งานบ่อย แนะนำให้แบ่งชุดข้อสอบหรือเนื้อหาเป็นชุดเล็กลง</li>
              </ul>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
          
          {onRetry && (
            <button
              onClick={() => {
                if (isResetComplete || errorType === 'UNKNOWN') {
                  onClose();
                  onRetry();
                }
              }}
              disabled={!isResetComplete && (errorType === 'RATE_LIMIT' || errorType === 'QUOTA_EXCEEDED')}
              className={`px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all flex items-center space-x-2 ${
                isResetComplete || errorType === 'UNKNOWN'
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-600/30 animate-pulse'
                  : 'bg-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isResetComplete ? 'ลองใหม่อีกครั้ง (Retry)' : 'กรุณารอนับถอยหลัง'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
