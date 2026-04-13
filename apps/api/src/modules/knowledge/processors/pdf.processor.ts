import { PDFParse } from 'pdf-parse';
import * as fs from 'fs/promises';
import { TextChunk, chunkText } from '../utils/chunker';

export class PdfProcessor {
  async process(filePath: string): Promise<TextChunk[]> {
    const buffer = await fs.readFile(filePath);
    const pdf = new PDFParse({ data: new Uint8Array(buffer) });
    const textResult = await pdf.getText();
    await pdf.destroy();

    const chunks = chunkText(textResult.text);

    // Enrich with approximate page info
    const totalPages = textResult.total || 1;
    const charsPerPage = textResult.text.length / totalPages;

    for (const chunk of chunks) {
      const startChar = chunk.metadata.startChar ?? 0;
      chunk.metadata.page = Math.floor(startChar / charsPerPage) + 1;
    }

    return chunks;
  }
}
