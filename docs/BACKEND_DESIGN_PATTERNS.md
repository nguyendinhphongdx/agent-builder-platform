# Backend Design Patterns

## 1. Entity Inheritance

All entities MUST extend from base entity classes. Never define `id`, `tenant_id`, `created_at`, `updated_at`, `deleted_at` manually.

### Base Classes

```mardown
BaseEntity (common/entities/base.entity.ts)
├── id: UUID (PK, auto-generated)
├── tenant_id: UUID
├── created_at: timestamp
├── updated_at: timestamp
├── deleted_at: timestamp (soft delete)
└── toResponse(): Record<string, unknown>  ← override to hide sensitive fields

AuditableEntity extends BaseEntity (common/entities/auditable.entity.ts)
├── ...all BaseEntity fields
├── created_by: UUID (nullable)
└── updated_by: UUID (nullable)
```

### Which to extend?

| Use Case | Extend |
|----------|--------|
| User-created resources (agents, tools, workflows) | `AuditableEntity` |
| System/junction tables (agent_tools, agent_shares) | `BaseEntity` |
| Standalone tables (users, tenants) | `BaseEntity` |
| Log/metric tables (audit_logs, usage_metrics) | `BaseEntity` |

### Example

```typescript
import { Entity, Column } from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';

@Entity('agents')
export class Agent extends AuditableEntity {
  // DO NOT add id, tenant_id, created_at, updated_at, deleted_at, created_by, updated_by
  // They come from AuditableEntity

  @Column({ type: 'varchar' })
  name!: string;

  // Override to hide sensitive fields in API response
  override toResponse(): Record<string, unknown> {
    const response = { ...this } as Record<string, unknown>;
    delete response.some_internal_field;
    return response;
  }
}
```

---

## 2. Request Context (CLS Pattern)

Use `RequestContextService` (injectable) to access current user/tenant in services.

### Setup

- `RequestContextModule` uses `nestjs-cls` ClsModule with middleware
- JWT Strategy calls `this.ctx.setUser()` after validation
- All services inject `RequestContextService`

### Usage in Service

```typescript
@Injectable()
export class MyService {
  constructor(
    @InjectRepository(MyEntity) private repo: Repository<MyEntity>,
    private readonly ctx: RequestContextService,
  ) {}

  async findAll() {
    return this.repo.find({
      where: { tenant_id: this.ctx.tenantId },
    });
  }

  async create(dto: CreateDto) {
    return this.repo.save({
      ...dto,
      tenant_id: this.ctx.tenantId,
      created_by: this.ctx.userId,
    });
  }
}
```

### Rules

- **Services**: inject `RequestContextService` as `ctx`
- **Controllers**: NEVER inject `ctx`, let services handle it
- **Controllers**: only use `@Body()`, `@Param()`, `@Query()`, `@Res()` (for SSE)

---

## 3. Response Transformation

`TransformInterceptor` automatically wraps all responses:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

If `data` is a `BaseEntity` instance → calls `toResponse()` automatically.
If `data` is an array of entities → maps each to `toResponse()`.

---

## 4. Config Pattern

Use `registerAs` for all configs:

```typescript
// config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
}));

// Usage in service
this.configService.get('database.host')
```

---

## 5. Module Structure

Each feature module follows this structure:

```mardown
modules/feature-name/
├── feature-name.module.ts      # Module definition
├── feature-name.controller.ts  # HTTP endpoints
├── feature-name.service.ts     # Business logic
├── dto/
│   ├── create-feature.dto.ts   # Input validation
│   ├── update-feature.dto.ts   # PartialType of create
│   └── query-feature.dto.ts    # Filter/pagination
├── entities/
│   ├── feature.entity.ts       # TypeORM entity (extends Base/Auditable)
│   └── related.entity.ts
└── enums/
    └── feature-status.enum.ts
```

---

## 6. Error Handling

- `HttpExceptionFilter` catches HttpException → structured error response
- `AllExceptionsFilter` catches unhandled errors → generic 500 response
- `TimeoutInterceptor` enforces 30s timeout on all requests
- Services throw NestJS exceptions: `NotFoundException`, `ForbiddenException`, etc.

---

## 7. Authentication & Authorization

- JWT on HttpOnly cookies (access_token + refresh_token)
- `JwtAuthGuard` (global) validates all requests, skip with `@Public()`
- `RolesGuard` (global) checks roles, use `@Roles('admin', 'owner')`
- `@CurrentUser()` decorator extracts user from request (use sparingly in controllers)
