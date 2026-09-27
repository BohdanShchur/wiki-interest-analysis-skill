import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

function sanitizePdfText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '');
}

function wrapPdfText(value: string, maxCharsPerLine = 82): string[] {
  const normalized = sanitizePdfText(value).replace(/\r/g, '');
  const paragraphs = normalized.split('\n').map((paragraph) => paragraph.trim()).filter(Boolean);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxCharsPerLine) {
        current = candidate;
      } else {
        if (current) {
          lines.push(current);
        }
        current = word;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines.length > 0 ? lines : ['No summary available'];
}

export async function generatePdfReport(outputDir: string, summary: string, title: string): Promise<string> {
  mkdirSync(outputDir, { recursive: true });
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const safeTitle = sanitizePdfText(title);
  const descriptionLines = wrapPdfText(summary, 82);

  let page = pdfDoc.addPage([595, 842]);
  const margin = 56;
  let y = 780;

  page.drawText(safeTitle, {
    x: margin,
    y,
    size: 22,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.2),
  });

  y -= 36;
  page.drawText('Wikipedia Interest Analysis', {
    x: margin,
    y,
    size: 11,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  y -= 26;
  page.drawText('Summary', {
    x: margin,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.22),
  });

  y -= 18;
  for (const line of descriptionLines) {
    if (y < 52) {
      page = pdfDoc.addPage([595, 842]);
      y = 780;
    }

    page.drawText(line, {
      x: margin,
      y,
      size: 10.5,
      font,
      color: rgb(0.18, 0.23, 0.3),
      maxWidth: 475,
    });

    y -= 15;
  }

  const filePath = path.join(outputDir, 'report.pdf');
  const bytes = await pdfDoc.save();
  writeFileSync(filePath, Buffer.from(bytes));
  return filePath;
}
