'use client';

import { useState, useCallback } from 'react';

export interface QuotaNoticeState {
  isOpen: boolean;
  errorType: 'RATE_LIMIT' | 'QUOTA_EXCEEDED' | 'TOKEN_LIMIT' | 'API_KEY_MISSING' | 'UNKNOWN';
  errorMessage: string;
  retryAfterSeconds: number;
}

export function useGeminiQuotaNotice() {
  const [notice, setNotice] = useState<QuotaNoticeState>({
    isOpen: false,
    errorType: 'RATE_LIMIT',
    errorMessage: '',
    retryAfterSeconds: 60,
  });

  const showNotice = useCallback((
    errorType: QuotaNoticeState['errorType'] = 'RATE_LIMIT',
    errorMessage: string = '',
    retryAfterSeconds: number = 60
  ) => {
    setNotice({
      isOpen: true,
      errorType,
      errorMessage,
      retryAfterSeconds: retryAfterSeconds > 0 ? retryAfterSeconds : 60,
    });
  }, []);

  const closeNotice = useCallback(() => {
    setNotice((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleFetchError = useCallback(async (res: Response, fallbackMessage: string = 'เกิดข้อผิดพลาดในการประมวลผล') => {
    let data: any = {};
    try {
      data = await res.json();
    } catch (e) {
      // ignore json error
    }

    const errorMessage = data.error || data.message || fallbackMessage;
    const errorType = data.errorType || (res.status === 429 ? 'RATE_LIMIT' : 'UNKNOWN');
    const retryAfterSeconds = data.retryAfterSeconds || 60;

    if (res.status === 429 || errorType === 'RATE_LIMIT' || errorType === 'QUOTA_EXCEEDED') {
      showNotice(errorType, errorMessage, retryAfterSeconds);
      return { handled: true, errorMessage };
    }

    return { handled: false, errorMessage };
  }, [showNotice]);

  return {
    notice,
    showNotice,
    closeNotice,
    handleFetchError,
  };
}
