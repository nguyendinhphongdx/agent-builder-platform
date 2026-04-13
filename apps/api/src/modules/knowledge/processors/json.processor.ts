import * as fs from 'fs/promises';
import { TextChunk, chunkText } from '../utils/chunker';

export class JsonProcessor {
  async process(filePath: string): Promise<TextChunk[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    if (Array.isArray(parsed)) {
      // Each item becomes a chunk
      return parsed.map((item, index) => ({
        content: JSON.stringify(item, null, 2),
        metadata: {
          chunkIndex: index,
        },
      }));
    }

    // Object: stringify and split into chunks
    const text = JSON.stringify(parsed, null, 2);
    return chunkText(text);
  }
}
