import * as fs from 'fs/promises';
import { TextChunk } from '../utils/chunker';

export class CsvProcessor {
  async process(filePath: string): Promise<TextChunk[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
      return [];
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const dataRows = lines.slice(1);

    const chunks: TextChunk[] = [];
    const rowsPerChunk = 10;

    for (let i = 0; i < dataRows.length; i += rowsPerChunk) {
      const batch = dataRows.slice(i, i + rowsPerChunk);
      const chunkContent = batch
        .map((row) => {
          const values = row.split(',').map((v) => v.trim());
          return headers
            .map((header, idx) => `${header}: ${values[idx] ?? ''}`)
            .join(', ');
        })
        .join('\n');

      chunks.push({
        content: chunkContent,
        metadata: {
          chunkIndex: chunks.length,
        },
      });
    }

    return chunks;
  }
}
