import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from 'docx';

export interface ExportPage {
  pageNumber: number;
  transcription?: string;
  translation?: string;
  confidence?: string;
}

export interface DocxExportOptions {
  jobId: string;
  documentName: string;
  targetLanguage: string;
  pages: ExportPage[];
  includeTranscription?: boolean;
}

export async function generateDocx(options: DocxExportOptions): Promise<Buffer> {
  const { documentName, targetLanguage, pages, includeTranscription = true } = options;

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      text: 'SCRIPTORIA',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  children.push(
    new Paragraph({
      text: 'Old French Document Translation',
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Metadata table
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: 'Document', style: 'Strong' })],
            shading: { type: ShadingType.SOLID, color: 'F5E6D3' },
          }),
          new TableCell({
            children: [new Paragraph({ text: documentName })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: 'Target Language', style: 'Strong' })],
            shading: { type: ShadingType.SOLID, color: 'F5E6D3' },
          }),
          new TableCell({
            children: [new Paragraph({ text: targetLanguage })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: 'Pages', style: 'Strong' })],
            shading: { type: ShadingType.SOLID, color: 'F5E6D3' },
          }),
          new TableCell({
            children: [new Paragraph({ text: String(pages.length) })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: 'Generated', style: 'Strong' })],
            shading: { type: ShadingType.SOLID, color: 'F5E6D3' },
          }),
          new TableCell({
            children: [new Paragraph({ text: new Date().toLocaleDateString() })],
          }),
        ],
      }),
    ],
  });

  children.push(metaTable);
  children.push(new Paragraph({ text: '', spacing: { after: 600 } }));

  // Pages
  for (const page of pages) {
    // Page heading
    children.push(
      new Paragraph({
        text: `Page ${page.pageNumber}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 2,
            color: 'C4A468',
          },
        },
      })
    );

    if (page.confidence) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Confidence: `,
              bold: true,
              size: 18,
            }),
            new TextRun({
              text: page.confidence.toUpperCase(),
              color: page.confidence === 'high' ? '2E7D32' : page.confidence === 'medium' ? 'F57F17' : 'C62828',
              bold: true,
              size: 18,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Transcription section
    if (includeTranscription && page.transcription) {
      children.push(
        new Paragraph({
          text: 'Original French Transcription',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: page.transcription,
              italics: true,
              color: '5D4E37',
              size: 22,
            }),
          ],
          spacing: { after: 300 },
          shading: { type: ShadingType.SOLID, color: 'FDF8F0' },
          indent: { left: 300, right: 300 },
        })
      );
    }

    // Translation section
    if (page.translation) {
      children.push(
        new Paragraph({
          text: 'Translation',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: page.translation,
              size: 22,
              color: '1A2855',
            }),
          ],
          spacing: { after: 400 },
          indent: { left: 300, right: 300 },
        })
      );
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 24,
          },
        },
      },
    },
    sections: [
      {
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
