// @ts-ignore
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import JSZip from 'jszip';

export interface ExtractedDocument {
  text: string;
  pageCount: number;
  fileName: string;
  fileType: string;
}

export async function parseFile(fileBuffer: Buffer, fileName: string): Promise<ExtractedDocument> {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (ext === 'txt') {
    const text = fileBuffer.toString('utf-8');
    return {
      text,
      pageCount: Math.ceil(text.length / 1500) || 1,
      fileName,
      fileType: 'txt',
    };
  }

  if (ext === 'pdf') {
    try {
      const parsed = await pdfParse(fileBuffer);
      return {
        text: parsed.text || '',
        pageCount: parsed.numpages || 1,
        fileName,
        fileType: 'pdf',
      };
    } catch (e) {
      console.error('PDF parsing error:', e);
      return {
        text: `[ไม่สามารถดึงข้อความจากไฟล์ PDF ${fileName} ได้โดยตรง]`,
        pageCount: 1,
        fileName,
        fileType: 'pdf',
      };
    }
  }

  if (ext === 'docx') {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const text = result.value || '';
      return {
        text,
        pageCount: Math.ceil(text.length / 1500) || 1,
        fileName,
        fileType: 'docx',
      };
    } catch (e) {
      console.error('DOCX parsing error:', e);
      return {
        text: `[ไม่สามารถอ่านข้อความจากไฟล์ DOCX ${fileName} ได้]`,
        pageCount: 1,
        fileName,
        fileType: 'docx',
      };
    }
  }

  if (ext === 'pptx') {
    try {
      const zip = await JSZip.loadAsync(fileBuffer);
      const slideFiles = Object.keys(zip.files).filter((fname) =>
        fname.startsWith('ppt/slides/slide') && fname.endsWith('.xml')
      );

      let fullText = '';
      for (const slidePath of slideFiles) {
        const xmlContent = await zip.files[slidePath].async('string');
        // Extract text between <a:t> tags in PPTX XML
        const textMatches = xmlContent.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
        const slideText = textMatches
          .map((m) => m.replace(/<[^>]+>/g, ''))
          .join(' ');
        fullText += slideText + '\n\n';
      }

      return {
        text: fullText.trim() || `[ไฟล์สไลด์ PPTX ${fileName}]`,
        pageCount: slideFiles.length || 1,
        fileName,
        fileType: 'pptx',
      };
    } catch (e) {
      console.error('PPTX parsing error:', e);
      return {
        text: `[ไฟล์ PPTX ${fileName}]`,
        pageCount: 1,
        fileName,
        fileType: 'pptx',
      };
    }
  }

  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
    return {
      text: `[ไฟล์รูปภาพ ${fileName} - สามารถนำไปให้ Gemini Vision วิเคราะห์เนื้อหา]`,
      pageCount: 1,
      fileName,
      fileType: ext,
    };
  }

  return {
    text: fileBuffer.toString('utf-8'),
    pageCount: 1,
    fileName,
    fileType: ext,
  };
}
