import * as mammoth from 'mammoth';
import { TextChunk, chunkText } from '../utils/chunker';

export class DocxProcessor {
  async process(filePath: string): Promise<TextChunk[]> {
    const result = await mammoth.extractRawText({ path: filePath });
    return chunkText(result.value);
  }
}
