import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import type { JobPageRecord } from '@/types';

const MARGIN = 50;
const PAGE_WIDTH = 595; // A4
const PAGE_HEIGHT = 842; // A4
const LINE_HEIGHT = 16;
const FONT_SIZE = 11;
const HEADER_SIZE = 14;
const TITLE_SIZE = 18;

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function drawTextBlock(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number = FONT_SIZE,
  color = rgb(0.1, 0.1, 0.1)
): Promise<number> {
  const charsPerLine = Math.floor(maxWidth / (fontSize * 0.55));
  const lines = wrapText(text, charsPerLine);
  let currentY = y;

  for (const line of lines) {
    if (currentY < MARGIN + LINE_HEIGHT) break;
    page.drawText(line, { x, y: currentY, font, size: fontSize, color });
    currentY -= LINE_HEIGHT;
  }

  return currentY;
}

export interface ExportPage {
  pageNumber: number;
  transcription?: string;
  translation?: string;
  confidence?: string;
}

export interface PdfExportOptions {
  jobId: string;
  documentName: string;
  targetLanguage: string;
  pages: ExportPage[];
  includeTranscription?: boolean;
}

export async function generatePdf(options: PdfExportOptions): Promise<Buffer> {
  const { documentName, targetLanguage, pages, includeTranscription = true } = options;

  const pdfDoc = await PDFDocument.create();

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Title page
  const titlePage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - 100;

  titlePage.drawText('SCRIPTORIA', {
    x: MARGIN,
    y,
    font: boldFont,
    size: 24,
    color: rgb(0.2, 0.1, 0.05),
  });
  y -= 40;

  titlePage.drawText('Old French Document Translation', {
    x: MARGIN,
    y,
    font: regularFont,
    size: 16,
    color: rgb(0.4, 0.3, 0.2),
  });
  y -= 30;

  // Draw separator
  titlePage.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: rgb(0.7, 0.6, 0.4),
  });
  y -= 30;

  titlePage.drawText(`Document: ${documentName}`, {
    x: MARGIN,
    y,
    font: regularFont,
    size: FONT_SIZE,
    color: rgb(0.3, 0.2, 0.1),
  });
  y -= 20;

  titlePage.drawText(`Target Language: ${targetLanguage}`, {
    x: MARGIN,
    y,
    font: regularFont,
    size: FONT_SIZE,
    color: rgb(0.3, 0.2, 0.1),
  });
  y -= 20;

  titlePage.drawText(`Pages: ${pages.length}`, {
    x: MARGIN,
    y,
    font: regularFont,
    size: FONT_SIZE,
    color: rgb(0.3, 0.2, 0.1),
  });
  y -= 20;

  titlePage.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
    x: MARGIN,
    y,
    font: regularFont,
    size: FONT_SIZE,
    color: rgb(0.3, 0.2, 0.1),
  });

  // Content pages
  for (const exportPage of pages) {
    const contentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let pageY = PAGE_HEIGHT - MARGIN;

    // Page header
    contentPage.drawText(`Page ${exportPage.pageNumber}`, {
      x: MARGIN,
      y: pageY,
      font: boldFont,
      size: HEADER_SIZE,
      color: rgb(0.2, 0.1, 0.05),
    });

    if (exportPage.confidence) {
      const confidenceColor =
        exportPage.confidence === 'high'
          ? rgb(0.1, 0.5, 0.1)
          : exportPage.confidence === 'medium'
          ? rgb(0.7, 0.5, 0.0)
          : rgb(0.7, 0.1, 0.1);

      contentPage.drawText(`Confidence: ${exportPage.confidence}`, {
        x: PAGE_WIDTH - MARGIN - 120,
        y: pageY,
        font: italicFont,
        size: 10,
        color: confidenceColor,
      });
    }

    pageY -= 25;

    contentPage.drawLine({
      start: { x: MARGIN, y: pageY },
      end: { x: PAGE_WIDTH - MARGIN, y: pageY },
      thickness: 0.5,
      color: rgb(0.7, 0.6, 0.4),
    });

    pageY -= 20;

    // Transcription section
    if (includeTranscription && exportPage.transcription) {
      contentPage.drawText('Original French Transcription:', {
        x: MARGIN,
        y: pageY,
        font: boldFont,
        size: FONT_SIZE,
        color: rgb(0.3, 0.2, 0.1),
      });
      pageY -= LINE_HEIGHT + 4;

      pageY = await drawTextBlock(
        contentPage,
        italicFont,
        exportPage.transcription,
        MARGIN,
        pageY,
        PAGE_WIDTH - 2 * MARGIN,
        FONT_SIZE,
        rgb(0.3, 0.25, 0.15)
      );

      pageY -= 25;
    }

    // Translation section
    if (exportPage.translation) {
      contentPage.drawText('Translation:', {
        x: MARGIN,
        y: pageY,
        font: boldFont,
        size: FONT_SIZE,
        color: rgb(0.1, 0.2, 0.4),
      });
      pageY -= LINE_HEIGHT + 4;

      pageY = await drawTextBlock(
        contentPage,
        regularFont,
        exportPage.translation,
        MARGIN,
        pageY,
        PAGE_WIDTH - 2 * MARGIN,
        FONT_SIZE,
        rgb(0.1, 0.15, 0.3)
      );
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
