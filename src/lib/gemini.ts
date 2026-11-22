import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export type GeminiErrorType = 'RATE_LIMIT' | 'QUOTA_EXCEEDED' | 'TOKEN_LIMIT' | 'API_KEY_MISSING' | 'UNKNOWN';

export class GeminiAPIError extends Error {
  errorType: GeminiErrorType;
  retryAfterSeconds: number;
  status: number;

  constructor(
    message: string,
    errorType: GeminiErrorType = 'UNKNOWN',
    retryAfterSeconds: number = 60,
    status: number = 429
  ) {
    super(message);
    this.name = 'GeminiAPIError';
    this.errorType = errorType;
    this.retryAfterSeconds = retryAfterSeconds;
    this.status = status;
  }
}

export function parseGeminiError(error: any): GeminiAPIError {
  if (error instanceof GeminiAPIError) {
    return error;
  }

  const msg = (error?.message || String(error)).toLowerCase();
  const status = error?.status || error?.statusCode || 500;

  if (msg.includes('gemini_api_key_missing') || msg.includes('api_key')) {
    return new GeminiAPIError(
      'ยังไม่ได้ตั้งค่า GEMINI_API_KEY กรุณาตรวจสอบการตั้งค่าในไฟล์ .env.local',
      'API_KEY_MISSING',
      0,
      400
    );
  }

  if (msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota') || msg.includes('rate limit')) {
    let seconds = 60;
    const retryMatch = msg.match(/retry after (\d+)s/i) || msg.match(/wait (\d+)s/i);
    if (retryMatch && retryMatch[1]) {
      seconds = parseInt(retryMatch[1], 10);
    }

    const errorType: GeminiErrorType = msg.includes('quota') ? 'QUOTA_EXCEEDED' : 'RATE_LIMIT';
    return new GeminiAPIError(
      `โควตาการใช้งาน Gemini API เต็มชั่วคราว (${errorType === 'QUOTA_EXCEEDED' ? 'Daily Quota Exceeded' : 'Rate Limit Exceeded'}) ระบบจะพร้อมใช้งานอีกครั้งในประมาณ ${seconds} วินาที`,
      errorType,
      seconds,
      429
    );
  }

  if (msg.includes('token') || msg.includes('context length') || msg.includes('too long')) {
    return new GeminiAPIError(
      'จำนวนโทเค็นในคำสั่งยาวเกินขีดจำกัดสูงสุดของโมเดล (Context Length Exceeded) กรุณาลดขนาดไฟล์หรือเนื้อหาลง',
      'TOKEN_LIMIT',
      0,
      400
    );
  }

  return new GeminiAPIError(
    error?.message || 'เกิดข้อผิดพลาดในการประมวลผลด้วย Gemini API',
    'UNKNOWN',
    0,
    status >= 400 && status < 600 ? status : 500
  );
}

export function formatGeminiErrorResponse(error: any) {
  const parsed = parseGeminiError(error);
  return NextResponse.json(
    {
      error: parsed.message,
      errorType: parsed.errorType,
      retryAfterSeconds: parsed.retryAfterSeconds,
      status: parsed.status,
    },
    { status: parsed.status }
  );
}

export async function generateJSONResponse<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY || '';

  if (!apiKey) {
    throw new GeminiAPIError('GEMINI_API_KEY_MISSING', 'API_KEY_MISSING', 0, 400);
  }

  const aiClient = new GoogleGenAI({ apiKey });
  let responseText = '';
  let lastError: any = null;

  // Model fallback sequence
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    try {
      const response = await aiClient.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || 'You are an expert Thai educator AI assistant. Output ONLY valid JSON.',
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      responseText = response.text || '';
      if (responseText) break;
    } catch (e: any) {
      console.warn(`Gemini model ${model} error:`, e?.message || e);
      lastError = e;
      const parsed = parseGeminiError(e);
      if (parsed.errorType === 'RATE_LIMIT' || parsed.errorType === 'QUOTA_EXCEEDED') {
        if (model === models[models.length - 1]) {
          throw parsed;
        }
      }
    }
  }

  if (!responseText && lastError) {
    throw parseGeminiError(lastError);
  }

  try {
    const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleanJson) as T;
  } catch (parseErr) {
    console.error('JSON Parse Error for response:', responseText);
    throw new GeminiAPIError('ไม่สามารถแปลงผลลัพธ์เป็น JSON ได้ตามรูปแบบที่ถูกต้อง', 'UNKNOWN', 0, 500);
  }
}
