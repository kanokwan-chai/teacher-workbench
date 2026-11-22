import {
  ScanRecord,
  StudentAnswerResult,
  DetectedAnswerStatus,
  ScanOverallStatus,
  ExamVersion,
} from './types';
import { decodeQRCodeFromCanvas } from './qrHelper';

export interface Point {
  x: number;
  y: number;
}

export interface OMRProcessingOptions {
  fillThreshold?: number; // Default 0.25 (25% pixel fill ratio)
  emptyThreshold?: number; // Default 0.15 (15% max fill ratio for empty)
  confidenceMargin?: number; // Default 0.10
}

export interface OMRProcessingResult {
  scanRecord: Partial<ScanRecord>;
  warpedCanvas: HTMLCanvasElement;
  detectedQrPayload: string | null;
  detectedPaperId: string | null;
  anchorsFound: Point[];
  overallStatus: ScanOverallStatus;
  statusMessage: string;
}

/**
 * Deterministic OMR Engine Pipeline
 * 1. Image Quality Validation
 * 2. QR Code Decoding (PAPER:<paper_id>)
 * 3. 4-Corner Fiducial Anchor Detection
 * 4. Bilinear Perspective Transformation & Image Warp to Normalized 800x1100 Canvas
 * 5. Adaptive Row-Baseline Contrast Bubble Sampling
 * 6. Visual Debug Circle Overlay
 */
export async function processOMRImage(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  version: ExamVersion,
  options: OMRProcessingOptions = {}
): Promise<OMRProcessingResult> {
  const fillThreshold = options.fillThreshold ?? 0.25;
  const emptyThreshold = options.emptyThreshold ?? 0.15;
  const confidenceMargin = options.confidenceMargin ?? 0.10;

  // Step 1: Create working Canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  const imgWidth = imageSource.width || (imageSource as HTMLCanvasElement).width;
  const imgHeight = imageSource.height || (imageSource as HTMLCanvasElement).height;

  canvas.width = imgWidth;
  canvas.height = imgHeight;
  ctx.drawImage(imageSource, 0, 0);

  // Step 2: Quality Check
  if (imgWidth < 250 || imgHeight < 250) {
    return createErrorResult(
      canvas,
      'INVALID_IMAGE',
      'ความละเอียดของภาพต่ำเกินไปสำหรับการตรวจอัตโนมัติ (ต้องการอย่างน้อย 250x250 พิกเซล)'
    );
  }

  // Step 3: Decode QR Code
  const qrResult = decodeQRCodeFromCanvas(ctx, imgWidth, imgHeight);

  // Step 4: Detect 4 Corner Fiducial Anchors (Top-Left, Top-Right, Bottom-Right, Bottom-Left)
  const anchors = detectFiducialAnchors(ctx, imgWidth, imgHeight);

  // Step 5: Bilinear Perspective Warp to 800x1100 Canvas
  const targetW = 800;
  const targetH = 1100; // Standard A4 Aspect Ratio
  const warpedCanvas = document.createElement('canvas');
  warpedCanvas.width = targetW;
  warpedCanvas.height = targetH;
  const warpedCtx = warpedCanvas.getContext('2d', { willReadFrequently: true })!;

  if (anchors.length === 4) {
    warpPerspective(ctx, warpedCtx, anchors, targetW, targetH);
  } else {
    // Fallback scaled draw
    warpedCtx.drawImage(imageSource, 0, 0, targetW, targetH);
  }

  // Get normalized warped image data for adaptive sampling
  const warpedImageData = warpedCtx.getImageData(0, 0, targetW, targetH);

  // Step 6: OMR Bubble Grid Processing
  const questionsCount = version.questions?.length || 40;
  const choicesList: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  const columnsCount = questionsCount > 60 ? 4 : questionsCount > 25 ? 2 : 1;
  const questionsPerCol = Math.ceil(questionsCount / columnsCount);

  const studentAnswers: StudentAnswerResult[] = [];
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let reviewCount = 0;
  let totalScore = 0;

  // Process Each Question
  for (let qIdx = 0; qIdx < questionsCount; qIdx++) {
    const qVersionItem = version.questions?.[qIdx];
    const qNum = qIdx + 1;

    const colIdx = Math.floor(qIdx / questionsPerCol);
    const rowIdx = qIdx % questionsPerCol;

    // Calculate grid cell bounding box on warped 800x1100 canvas
    const colWidth = targetW / columnsCount;
    let baseOptionStartX: number;
    let optionSpacingX: number;

    if (columnsCount === 1) {
      // 1-column layout (10-25 questions) spans full A4 sheet width
      baseOptionStartX = 190;
      optionSpacingX = 157;
    } else if (columnsCount === 2) {
      // 2-column layout (30-60 questions)
      baseOptionStartX = colIdx * colWidth + 115;
      optionSpacingX = 55;
    } else {
      // 4-column layout (>60 questions)
      baseOptionStartX = colIdx * colWidth + 55;
      optionSpacingX = 35;
    }

    const startY = 300 + rowIdx * 35;

    const fillRatios: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    const choiceRatios: { choice: 'A' | 'B' | 'C' | 'D'; ratio: number; x: number; y: number }[] = [];

    // Measure paper baseline lightness in this row
    const rowBaseline = getRowPaperBaseline(warpedImageData, colIdx * colWidth + 30, startY, 40);

    choicesList.forEach((choice, cIdx) => {
      const bubbleX = Math.round(baseOptionStartX + cIdx * optionSpacingX);
      const bubbleY = Math.round(startY);

      const ratio = sampleBubbleFillRatioAdaptive(warpedImageData, bubbleX, bubbleY, 12, rowBaseline);
      fillRatios[choice] = ratio;
      choiceRatios.push({ choice, ratio, x: bubbleX, y: bubbleY });
    });

    // Sort descending by darkness fill ratio
    choiceRatios.sort((a, b) => b.ratio - a.ratio);
    const highest = choiceRatios[0];
    const second = choiceRatios[1];

    let detected: DetectedAnswerStatus = 'UNANSWERED';
    let confidenceScore = 1.0;

    // Deterministic Classification Rules
    if (highest.ratio < emptyThreshold) {
      detected = 'UNANSWERED';
      unansweredCount++;
    } else if (highest.ratio >= fillThreshold && second.ratio >= fillThreshold && (highest.ratio - second.ratio) < confidenceMargin) {
      detected = 'MULTIPLE_ANSWERS';
      reviewCount++;
    } else if (highest.ratio >= fillThreshold && (highest.ratio - second.ratio) < (confidenceMargin * 1.4)) {
      detected = 'LOW_CONFIDENCE';
      confidenceScore = Math.max(0.4, highest.ratio - second.ratio);
      reviewCount++;
    } else if (highest.ratio >= fillThreshold) {
      detected = highest.choice;
      confidenceScore = Math.min(1.0, highest.ratio + 0.2);
    } else {
      detected = 'LOW_CONFIDENCE';
      confidenceScore = 0.5;
      reviewCount++;
    }

    const correctChoice = qVersionItem ? qVersionItem.correct_choice_in_version : 'A';
    const isCorrect = detected === correctChoice;

    if (detected !== 'UNANSWERED' && detected !== 'MULTIPLE_ANSWERS' && detected !== 'LOW_CONFIDENCE') {
      if (isCorrect) {
        correctCount++;
        totalScore += 1;
      } else {
        wrongCount++;
      }
    }

    studentAnswers.push({
      id: `ans-${qNum}-${Date.now()}`,
      scan_id: '',
      question_number: qNum,
      detected_answer: detected,
      final_answer: detected,
      confidence_score: Number(confidenceScore.toFixed(2)),
      fill_ratios: fillRatios as any,
      is_correct: isCorrect,
    });

    // Draw Debug Overlay Circles directly on Warped Canvas
    drawBubbleDebugCircle(warpedCtx, choiceRatios, detected, correctChoice);
  }

  // Determine Overall Scan Status
  let overallStatus: ScanOverallStatus = 'SUCCESS';
  let statusMessage = 'ตรวจข้อสอบสำเร็จเรียบร้อย';

  if (!qrResult.paperId) {
    overallStatus = 'QR_NOT_FOUND';
    statusMessage = 'ไม่พบ QR Code (ระบบสแกนด้วยโหมดข้อสอบสำรอง ชุด A)';
  } else if (anchors.length < 4) {
    overallStatus = 'ANCHOR_NOT_FOUND';
    statusMessage = 'ไม่พบ Anchor Markers 4 มุมครบถ้วน (ใช้วิธีประมาณการณ์ขอบกระดาษ)';
  } else if (reviewCount > 0) {
    overallStatus = 'LOW_CONFIDENCE';
    statusMessage = `พบ ${reviewCount} ข้อที่ต้องตรวจสอบเพิ่มเติม`;
  }

  const percentage = Number(((totalScore / questionsCount) * 100).toFixed(1));

  const scanRecord: Partial<ScanRecord> = {
    paper_id: qrResult.paperId || 'UNKNOWN',
    exam_id: version.exam_id,
    version_id: version.id,
    overall_confidence: reviewCount === 0 ? 1.0 : 0.7,
    scan_status: overallStatus,
    total_score: totalScore,
    correct_count: correctCount,
    wrong_count: wrongCount,
    unanswered_count: unansweredCount,
    review_count: reviewCount,
    percentage,
    answers: studentAnswers,
  };

  return {
    scanRecord,
    warpedCanvas,
    detectedQrPayload: qrResult.payload,
    detectedPaperId: qrResult.paperId,
    anchorsFound: anchors,
    overallStatus,
    statusMessage,
  };
}

// Fallback Error Creator
function createErrorResult(
  canvas: HTMLCanvasElement,
  status: ScanOverallStatus,
  msg: string
): OMRProcessingResult {
  return {
    scanRecord: {
      scan_status: status,
      total_score: 0,
      correct_count: 0,
      wrong_count: 0,
      unanswered_count: 0,
      review_count: 0,
      percentage: 0,
      answers: [],
    },
    warpedCanvas: canvas,
    detectedQrPayload: null,
    detectedPaperId: null,
    anchorsFound: [],
    overallStatus: status,
    statusMessage: msg,
  };
}

/**
 * Detect 4 Corner Fiducial Black Box Markers (Top-Left, Top-Right, Bottom-Right, Bottom-Left)
 */
export function detectFiducialAnchors(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): Point[] {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Define search regions for each corner quadrant
  const regions = [
    { name: 'TL', minX: 0, maxX: Math.floor(width * 0.35), minY: 0, maxY: Math.floor(height * 0.35) },
    { name: 'TR', minX: Math.floor(width * 0.65), maxX: width, minY: 0, maxY: Math.floor(height * 0.35) },
    { name: 'BR', minX: Math.floor(width * 0.65), maxX: width, minY: Math.floor(height * 0.65), maxY: height },
    { name: 'BL', minX: 0, maxX: Math.floor(width * 0.35), minY: Math.floor(height * 0.65), maxY: height },
  ];

  const points: Point[] = [];

  for (const reg of regions) {
    let sumX = 0;
    let sumY = 0;
    let count = 0;

    // Scan pixels in region for dark square marker (grayscale < 80)
    for (let y = reg.minY; y < reg.maxY; y += 2) {
      for (let x = reg.minX; x < reg.maxX; x += 2) {
        const idx = (y * width + x) * 4;
        const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        if (gray < 85) {
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }

    if (count > 15) {
      points.push({ x: Math.round(sumX / count), y: Math.round(sumY / count) });
    } else {
      // Fallback corner estimates
      if (reg.name === 'TL') points.push({ x: 30, y: 30 });
      if (reg.name === 'TR') points.push({ x: width - 30, y: 30 });
      if (reg.name === 'BR') points.push({ x: width - 30, y: height - 30 });
      if (reg.name === 'BL') points.push({ x: 30, y: height - 30 });
    }
  }

  return points;
}

/**
 * Bilinear Quad Perspective Transformation mapping [TL, TR, BR, BL] -> [0..targetW, 0..targetH]
 */
export function warpPerspective(
  srcCtx: CanvasRenderingContext2D,
  dstCtx: CanvasRenderingContext2D,
  anchors: Point[],
  targetW: number,
  targetH: number
) {
  if (anchors.length < 4) {
    dstCtx.drawImage(srcCtx.canvas, 0, 0, targetW, targetH);
    return;
  }

  const [TL, TR, BR, BL] = anchors;
  const srcImgData = srcCtx.getImageData(0, 0, srcCtx.canvas.width, srcCtx.canvas.height);
  const srcData = srcImgData.data;
  const srcW = srcCtx.canvas.width;
  const srcH = srcCtx.canvas.height;

  const dstImgData = dstCtx.createImageData(targetW, targetH);
  const dstData = dstImgData.data;

  for (let ty = 0; ty < targetH; ty++) {
    const v = ty / targetH;
    for (let tx = 0; tx < targetW; tx++) {
      const u = tx / targetW;

      // Bilinear interpolation from 4 corner points
      const sx = Math.round(
        (1 - u) * (1 - v) * TL.x + u * (1 - v) * TR.x + u * v * BR.x + (1 - u) * v * BL.x
      );
      const sy = Math.round(
        (1 - u) * (1 - v) * TL.y + u * (1 - v) * TR.y + u * v * BR.y + (1 - u) * v * BL.y
      );

      const dstIdx = (ty * targetW + tx) * 4;

      if (sx >= 0 && sx < srcW && sy >= 0 && sy < srcH) {
        const srcIdx = (sy * srcW + sx) * 4;
        dstData[dstIdx] = srcData[srcIdx];
        dstData[dstIdx + 1] = srcData[srcIdx + 1];
        dstData[dstIdx + 2] = srcData[srcIdx + 2];
        dstData[dstIdx + 3] = 255;
      } else {
        dstData[dstIdx] = 255;
        dstData[dstIdx + 1] = 255;
        dstData[dstIdx + 2] = 255;
        dstData[dstIdx + 3] = 255;
      }
    }
  }

  dstCtx.putImageData(dstImgData, 0, 0);
}

/**
 * Sample row paper baseline lightness
 */
function getRowPaperBaseline(imageData: ImageData, startX: number, startY: number, sampleWidth: number): number {
  const data = imageData.data;
  const w = imageData.width;
  let sumGray = 0;
  let count = 0;

  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = 0; dx < sampleWidth; dx++) {
      const x = Math.min(w - 1, Math.max(0, Math.floor(startX + dx)));
      const y = Math.min(imageData.height - 1, Math.max(0, Math.floor(startY + dy)));
      const idx = (y * w + x) * 4;
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      sumGray += gray;
      count++;
    }
  }

  return count > 0 ? sumGray / count : 240;
}

/**
 * Sample relative darkness of bubble region relative to row paper baseline
 */
function sampleBubbleFillRatioAdaptive(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  radius: number,
  paperBaseline: number
): number {
  const data = imageData.data;
  const w = imageData.width;
  const h = imageData.height;

  let darkPixels = 0;
  let totalPixels = 0;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) {
        const x = Math.floor(centerX + dx);
        const y = Math.floor(centerY + dy);

        if (x >= 0 && x < w && y >= 0 && y < h) {
          const idx = (y * w + x) * 4;
          const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

          // Pixel is dark if significantly darker than row paper baseline
          if (gray < paperBaseline * 0.72 || gray < 115) {
            darkPixels++;
          }
          totalPixels++;
        }
      }
    }
  }

  return totalPixels > 0 ? Number((darkPixels / totalPixels).toFixed(2)) : 0;
}

/**
 * Draw Visual Overlay Debug Circles on Warped Canvas
 */
function drawBubbleDebugCircle(
  ctx: CanvasRenderingContext2D,
  choiceRatios: { choice: 'A' | 'B' | 'C' | 'D'; ratio: number; x: number; y: number }[],
  detected: DetectedAnswerStatus,
  correctChoice: string
) {
  choiceRatios.forEach(({ choice, ratio, x, y }) => {
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, 2 * Math.PI);

    if (detected === choice) {
      if (choice === correctChoice) {
        ctx.strokeStyle = '#10b981'; // Green for correct
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      } else {
        ctx.strokeStyle = '#ef4444'; // Red for wrong answer
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      }
      ctx.lineWidth = 2.5;
      ctx.fill();
    } else if (ratio >= 0.20) {
      ctx.strokeStyle = '#f59e0b'; // Amber for flagged fill
      ctx.lineWidth = 1.5;
    } else {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'; // Gray for empty
      ctx.lineWidth = 1;
    }
    ctx.stroke();
  });
}
