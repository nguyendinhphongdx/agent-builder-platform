import * as fs from 'fs/promises';
import { TextChunk, chunkText } from '../utils/chunker';

export class TextProcessor {
  async process(filePath: string): Promise<TextChunk[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    return chunkText(content);
  }
}
