import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadedFileInfo {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

@Injectable()
export class FilesService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'files');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File): Promise<UploadedFileInfo> {
    const fileId = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    const fileName = `${fileId}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return {
      id: fileId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/files/${fileName}`,
    };
  }

  getFilePath(fileId: string): { filePath: string; exists: boolean } {
    // Look for file with any extension matching the id
    const files = fs.readdirSync(this.uploadDir);
    const match = files.find((f) => f.startsWith(fileId));

    if (!match) {
      return { filePath: '', exists: false };
    }

    const filePath = path.join(this.uploadDir, match);
    return { filePath, exists: fs.existsSync(filePath) };
  }
}
