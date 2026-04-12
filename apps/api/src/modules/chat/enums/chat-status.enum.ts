export enum ChatSessionStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  TOOL = 'tool',
}

export enum ContentType {
  TEXT = 'text',
  MARKDOWN = 'markdown',
  CODE = 'code',
  IMAGE = 'image',
  FILE = 'file',
}
