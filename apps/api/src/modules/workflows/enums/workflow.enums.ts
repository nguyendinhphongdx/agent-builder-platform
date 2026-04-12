export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum WorkflowNodeType {
  TRIGGER = 'trigger',
  AGENT = 'agent',
  CONDITION = 'condition',
  ACTION = 'action',
  TRANSFORM = 'transform',
  OUTPUT = 'output',
  DELAY = 'delay',
  LOOP = 'loop',
  PARALLEL = 'parallel',
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

export enum ExecutionLogStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}
