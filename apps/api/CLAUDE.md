# Backend - NestJS

- Design patterns: [BACKEND_DESIGN_PATTERNS.md](../../docs/BACKEND_DESIGN_PATTERNS.md)
- Progress & TODO: [MASTER_PLAN.md](../../docs/MASTER_PLAN.md)

## Architecture

- Modular: `src/modules/{auth,users,agents,tools,chat,workflows,knowledge,files,audit}/`
- Each module: `module.ts`, `controller.ts`, `service.ts`, `dto/`, `entities/`, `enums/`
- Common utilities: `src/common/{context,decorators,entities,filters,guards,interceptors,interfaces}/`
- Config: `src/config/{app,database,jwt}.config.ts` using `registerAs` pattern

## Critical Rules

- All entities MUST extend `BaseEntity` or `AuditableEntity` (never define id/tenant_id/timestamps)
- `RequestContextService` is injectable - use ONLY in services via `this.ctx.tenantId`, `this.ctx.userId`
- Controllers NEVER inject `RequestContextService` - only `@Body()`, `@Param()`, `@Query()`, `@Res()`
- Every query MUST filter by `tenant_id` (multi-tenant system)
- `toResponse()` override on entities to hide sensitive fields (called automatically by TransformInterceptor)
- Config access: `this.configService.get('jwt.accessSecret')` (namespaced via registerAs)

## Request Flow

```
Request → CLS Middleware (set ip, userAgent)
  → JwtAuthGuard (validate token, skip if @Public())
  → JwtStrategy.validate() → ctx.setUser({userId, email, tenantId, role})
  → RolesGuard (check @Roles() if present)
  → Controller → Service (uses this.ctx.tenantId/userId)
  → TransformInterceptor (wrap response + call toResponse() on entities)
```

## What's Mock (needs real implementation)

- `chat.service.ts` → `mockLLMStream()` - replace with LiteLLM API
- `tool-executor.service.ts` → mock test results - implement real executors
- `workflow-engine.service.ts` → mock execution - implement LangGraph conversion
- `knowledge.service.ts` → saves files but no processing - implement parsers + embeddings

## Commands

```bash
npm run start:dev   # Dev server with watch on :3001
npm run build       # Production build
npm run seed        # Seed built-in tools
npm run lint        # ESLint
```
