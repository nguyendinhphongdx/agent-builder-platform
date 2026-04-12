# Agent Builder Platform

A multi-tenant platform for building, managing, and orchestrating AI agents with visual workflow editor.

## Project Status: Phase 1 Complete

Both FE and BE **build successfully**. Core scaffold, UI, and backend modules are done.
What remains is real LLM integration, tool executors, and knowledge processing. See [MASTER_PLAN.md](docs/MASTER_PLAN.md) for full TODO list.

## Monorepo Layout

```
apps/web/     → Next.js 14 frontend (port 3000)
apps/api/     → NestJS backend (port 3001)
services/     → Docker compose per service (postgres, redis, rabbitmq, litellm)
docs/         → Plans and architecture docs
```

## Quick Start

```bash
docker-compose up -d          # Start Postgres, Redis, RabbitMQ, LiteLLM
cd apps/api && npm install && npm run start:dev
cd apps/web && npm install && npm run dev
```

## Key Architecture Decisions

### Frontend (apps/web)
- **Feature-based structure**: `src/features/{auth,agents,tools,workflows,layout,settings}/`
- Each feature has: `hooks/`, `services/`, `components/`, `pages/`
- **App Router pages are thin wrappers** - only import from features, no logic in app/
- **Zustand** for client state (UI, form drafts), **TanStack Query** for server state
- **Axios instance** at `src/libs/axios.ts` with auto refresh token on 401
- All UI components are Shadcn/UI at `src/components/ui/`

### Backend (apps/api)
- **READ FIRST**: [Backend Design Patterns](docs/BACKEND_DESIGN_PATTERNS.md)
- **Modular**: `src/modules/{auth,users,agents,tools,chat,workflows,knowledge,files,audit}/`
- **All entities extend BaseEntity or AuditableEntity** - never define id/tenant_id/timestamps manually
- **RequestContextService** (injectable via nestjs-cls) for tenant_id/userId - used in services only, NEVER in controllers
- **Controllers** only use `@Body()`, `@Param()`, `@Query()` - no `@CurrentUser()` for passing to services
- **toResponse()** on entities - TransformInterceptor calls it automatically to hide sensitive fields
- **Config**: use `registerAs('namespace', ...)` pattern, access via `configService.get('namespace.key')`
- **Auth**: JWT on HttpOnly cookies, refresh token rotation

### Important Patterns
- `ctx.tenantId` and `ctx.userId` come from RequestContextService (injected in services)
- Soft delete via `deleted_at` column (inherited from BaseEntity)
- API responses wrapped automatically: `{ success: true, data: ..., timestamp: ... }`
- Multi-tenancy: every query must filter by `tenant_id`

## What's Working (Phase 1)
- Auth: login, register, JWT refresh, AuthGuard on all dashboard routes
- Agents: CRUD, library with filters, builder with split-screen chat preview (SSE, mock LLM)
- Tools: CRUD, 8 built-in tools, type-specific config forms, test panel
- Workflows: visual editor (React Flow), 6 node types, save/load
- Chat: SSE streaming (mock responses), session management
- Knowledge: file upload UI (drag & drop), status tracking
- All docker-compose files for infrastructure services

## What Needs Work (Phase 2)
1. **LLM Integration**: Replace `mockLLMStream()` in `chat.service.ts` with real LiteLLM calls
2. **LangGraph**: Implement agent execution graph (LLM Node → Tool Node → loop)
3. **Tool Executors**: Real HTTP, code sandbox, DB query, MCP, web search executors
4. **Knowledge Processing**: PDF/DOCX parsing, embeddings, RAG retrieval
5. **Workflow Engine**: Convert React Flow nodes → LangGraph StateGraph, execute
6. **FE-BE Integration**: Test all flows end-to-end, fix API contract mismatches

See [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) for full progress tracking (Done/TODO checklist with priorities).

## Do NOT
- Add id/tenant_id/created_at/updated_at/deleted_at to entities (inherited from BaseEntity)
- Use RequestContextService in controllers (only in services)
- Write logic directly in app/ route pages (use features/)
- Use `import type` for types used in NestJS decorators (isolatedModules is off)
- Skip `tenant_id` filtering in queries (multi-tenant system)
