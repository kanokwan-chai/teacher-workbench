import QRCode from 'qrcode';
import jsQR from 'jsqr';

/**
 * Generate QR Data URL for a paper_id
 * Payload format: PAPER:<paper_id>
 */
export async function generatePaperQRCode(paperId: string): Promise<string> {
  const payload = paperId.startsWith('PAPER:') ? paperId : `PAPER:${paperId}`;
  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 250,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('QR Code Generation Error:', err);
    throw err;
  }
}

/**
 * Scan Canvas ImageData to detect QR Code payload
 */
export function decodeQRCodeFromCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { payload: string | null; paperId: string | null; location: any } {
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (code && code.data) {
      const payload = code.data.trim();
      let paperId: string | null = null;

      if (payload.startsWith('PAPER:')) {
        paperId = payload.replace('PAPER:', '').trim();
      } else if (/^[A-Z0-9]{6,12}$/i.test(payload)) {
        paperId = payload;
      }

      return {
        payload,
        paperId,
        location: code.location,
      };
    }
  } catch (e) {
    console.warn('QR Decode Error:', e);
  }

  return { payload: null, paperId: null, location: null };
}
