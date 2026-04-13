import * as fs from 'fs/promises';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import { ToolExecutor, ToolExecutionResult } from './base.executor';

export class FileParserExecutor implements ToolExecutor {
  async execute(config: Record<string, any>, input: Record<string, any>): Promise<ToolExecutionResult> {
    const start = Date.now();

    try {
      const filePath: string = input.file_url || input.file_path || '';
      if (!filePath) {
        return {
          success: false,
          output: null,
          error: 'No file path provided. Pass "file_url" or "file_path" in input.',
          durationMs: Date.now() - start,
        };
      }

      const maxSizeMb: number = config.max_file_size_mb || 10;
      const ext = path.extname(filePath).toLowerCase();

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return {
          success: false,
          output: null,
          error: `File not found: ${filePath}`,
          durationMs: Date.now() - start,
        };
      }

      // Check file size
      const stats = await fs.stat(filePath);
      const sizeMb = stats.size / (1024 * 1024);
      if (sizeMb > maxSizeMb) {
        return {
          success: false,
          output: null,
          error: `File too large: ${sizeMb.toFixed(2)}MB exceeds limit of ${maxSizeMb}MB`,
          durationMs: Date.now() - start,
        };
      }

      const supportedTextFormats = ['.txt', '.md', '.csv', '.json', '.log', '.xml', '.yaml', '.yml'];
      const needsLibrary = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx'];

      if (supportedTextFormats.includes(ext)) {
        const content = await fs.readFile(filePath, 'utf-8');
        return {
          success: true,
          output: {
            file: filePath,
            format: ext,
            sizeBytes: stats.size,
            content,
          },
          durationMs: Date.now() - start,
        };
      }

      if (ext === '.pdf') {
        const buffer = await fs.readFile(filePath);
        const pdf = new PDFParse({ data: new Uint8Array(buffer) });
        const textResult = await pdf.getText();
        const infoResult = await pdf.getInfo();
        await pdf.destroy();
        return {
          success: true,
          output: {
            file: filePath,
            format: ext,
            sizeBytes: stats.size,
            content: textResult.text,
            pages: textResult.total,
            info: infoResult.info as Record<string, unknown>,
          },
          durationMs: Date.now() - start,
        };
      }

      if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        return {
          success: true,
          output: {
            file: filePath,
            format: ext,
            sizeBytes: stats.size,
            content: result.value,
          },
          durationMs: Date.now() - start,
        };
      }

      if (needsLibrary.includes(ext)) {
        return {
          success: false,
          output: null,
          error: `Parser not implemented for ${ext}`,
          durationMs: Date.now() - start,
        };
      }

      return {
        success: false,
        output: null,
        error: `Unsupported file format: ${ext}`,
        durationMs: Date.now() - start,
      };
    } catch (error: any) {
      return {
        success: false,
        output: null,
        error: error.message || 'File parsing failed',
        durationMs: Date.now() - start,
      };
    }
  }
}
