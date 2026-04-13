export interface TextChunk {
  content: string;
  metadata: {
    chunkIndex: number;
    page?: number;
    startChar?: number;
    endChar?: number;
  };
}

export function chunkText(
  text: string,
  maxChunkSize = 1000,
  overlap = 200,
): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChunkSize, text.length);

    // Don't split mid-word: if we're not at the end, find the last space
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start) {
        end = lastSpace;
      }
    }

    const content = text.slice(start, end).trim();
    if (content.length > 0) {
      chunks.push({
        content,
        metadata: {
          chunkIndex,
          startChar: start,
          endChar: end,
        },
      });
      chunkIndex++;
    }

    // Move forward by (end - start - overlap), but at least 1 char to avoid infinite loop
    const step = Math.max(end - start - overlap, 1);
    start = start + step;
  }

  return chunks;
}
