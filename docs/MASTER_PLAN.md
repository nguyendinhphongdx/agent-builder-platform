# Agent Builder Platform - Master Plan

## Project Status: Phase 1 Complete (Scaffold + Core UI + Backend)

---

## Monorepo Structure

```
root/
├── apps/
│   ├── web/                      # Frontend - Next.js 14
│   └── api/                      # Backend - NestJS
├── services/
│   ├── postgres/                 # PostgreSQL + docker-compose
│   ├── redis/                    # Redis + docker-compose
│   ├── rabbitmq/                 # RabbitMQ + docker-compose
│   └── ai-service/              # LiteLLM proxy + docker-compose
├── docs/                         # Documentation & Plans
├── docker-compose.yml            # Root compose (orchestrate all)
├── package.json                  # Root workspace config
├── .gitignore
└── README.md
```

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS v4, Shadcn/UI |
| State | Zustand (client state), TanStack Query (server state) |
| HTTP Client | Axios (instance with auto refresh token on 401) |
| Auth | JWT (access + refresh token on HttpOnly cookies) |
| Backend | NestJS, TypeScript, TypeORM |
| Request Context | nestjs-cls (ClsModule) + RequestContextService injectable |
| AI Orchestration | LangGraph (planned - not yet implemented) |
| LLM Gateway | LiteLLM (docker-compose ready, not yet integrated) |
| Database | PostgreSQL |
| Cache | Redis |
| Message Queue | RabbitMQ |
| Workflow UI | React Flow |
| File Upload | react-dropzone |
| Container | Docker + docker-compose per service |

---

## What's DONE (Phase 1)

### Frontend (apps/web) - BUILD PASSING

- [x] Project setup: Next.js 14 + TailwindCSS v4 + Shadcn/UI (22 components)
- [x] Feature-based architecture: features/{auth,agents,tools,workflows,layout,settings}
- [x] Each feature: hooks/, services/, components/, pages/
- [x] Libs: axios instance (auto refresh), queryClient, cn helper, constants
- [x] Helpers: formatDate, formatFileSize, validators, fileUtils
- [x] Stores (Zustand): uiStore, agentFormStore, workflowStore
- [x] Types: agent, tool, workflow, chat, auth, common
- [x] Layout: Sidebar (collapsible), Header, AppShell, UserMenu
- [x] Auth: LoginPage, RegisterPage, AuthGuard, useAuth/useLogin/useLogout/useRegister
- [x] Agents: Library (grid + filters + 3-dot actions), Builder (split screen form + chat preview), Edit
- [x] Tools: List (built-in + custom), Create (type selector + per-type config forms), Test panel
- [x] Workflows: List, Editor (React Flow canvas + node palette + config panel), 6 custom node types
- [x] Settings: placeholder page
- [x] All dashboard routes wrapped with AuthGuard
- [x] App Router pages are thin wrappers importing from features/

### Backend (apps/api) - BUILD PASSING

- [x] NestJS modular structure: src/modules/{auth,users,agents,tools,chat,workflows,knowledge,files,audit}
- [x] Config: registerAs pattern (database, jwt, app configs)
- [x] Common: BaseEntity, AuditableEntity with toResponse() pattern
- [x] All 23 entities extend BaseEntity/AuditableEntity (no duplicate columns)
- [x] TransformInterceptor auto-calls toResponse() on entities (hides sensitive fields)
- [x] RequestContext: nestjs-cls + RequestContextService injectable (used in services only)
- [x] Auth: JWT on HttpOnly cookies, register, login, refresh (rotation), logout
- [x] JWT Strategy populates CLS context via ctx.setUser()
- [x] Guards: JwtAuthGuard (global), RolesGuard (global)
- [x] Filters: HttpExceptionFilter, AllExceptionsFilter
- [x] Interceptors: TransformInterceptor, LoggingInterceptor, TimeoutInterceptor (30s)
- [x] Agents: Full CRUD, slug generation, version snapshots, duplicate, share, collaborators
- [x] Tools: CRUD + built-in tools (tenant_id IS NULL), test endpoint (mock)
- [x] Chat: SSE streaming endpoint, mock LLM response, session management
- [x] Workflows: Transactional create/update (nodes+edges), mock execute with per-node logs
- [x] Knowledge: Multi-file upload, file processing status tracking
- [x] Files: Generic upload + serve
- [x] Audit: Fire-and-forget logging + usage metrics
- [x] Seed data: 8 built-in tools ready

### Services (docker-compose ready)

- [x] PostgreSQL 16 + extensions (uuid-ossp, pgcrypto, pg_trgm)
- [x] Redis 7 (cache, rate limiting, pub/sub)
- [x] RabbitMQ 3 (queues: knowledge.process, workflow.execute, tool.execute, notification.send)
- [x] LiteLLM (5 models: gpt-4o, gpt-4o-mini, claude-sonnet, claude-haiku, gemini-flash)
- [x] Root docker-compose orchestrating all services

### Design Patterns Documented

- [x] Backend design patterns: [BACKEND_DESIGN_PATTERNS.md](./BACKEND_DESIGN_PATTERNS.md)

---

## What's DONE (Phase 2 - Partial)

### P0 - LLM + LangGraph (DONE)

- [x] **LLM Service** (`chat/llm/llm.service.ts`): OpenAI SDK → LiteLLM proxy, streaming + non-streaming
- [x] **Chat SSE**: real LLM streaming with fallback to mock when LiteLLM unavailable
- [x] **LangGraph Agent Graph**: StateGraph with LLM Node → Tool Node → loop, conditional edges
- [x] **Agent Graph Service**: injectable NestJS service wrapping LangGraph execution
- [x] **Router Node**: placeholder for Super Agent mode (ready for implementation)

### P1 - Tool Executors (DONE)

- [x] **HTTP Executor**: real axios requests, template variables, auth (api_key/bearer/basic)
- [x] **Code Executor**: JavaScript sandbox via Node.js vm, captured console output, timeout
- [x] **DB Query Executor**: query preparation with escaping (real DB connection TODO)
- [x] **Web Search Executor**: DuckDuckGo instant answer API integration
- [x] **File Parser Executor**: reads txt/md/csv/json/xml/yaml (PDF/DOCX TODO)
- [x] **MCP Server Executor**: stub ready for MCP protocol
- [x] **Email Executor**: stub (SMTP TODO)
- [x] **Webhook Executor**: POST with secret header + retry
- [x] **Tool Executor Service**: dispatcher routing by tool type

### P1 - FE-BE API Contract (DONE)

- [x] Fixed double `/api` prefix in all FE API routes (16 files)
- [x] Added response unwrapping interceptor (auto-unwrap `{ success, data }` envelope)
- [x] Fixed RegisterDto field name (`name` → `fullName`)
- [x] Fixed query params (`pageSize` → `limit`, `sort` → `sortBy`)
- [x] Fixed SSE chat BASE_URL
- [x] Removed all double `.data.data` access patterns

---

## What's TODO (Phase 2 - For Next Developer)

### P0 - Critical (Must have to run end-to-end)

#### Start Services & Database

- [ ] `docker-compose up -d` to start Postgres, Redis, RabbitMQ
- [ ] Verify DB connection, run TypeORM sync (auto on dev)
- [ ] Run seed: `cd apps/api && npm run seed` to insert built-in tools
- [ ] Test: `npm run dev:api` starts without DB errors

#### Tenant LLM Key Integration

- [ ] Fetch agent's `model_config.provider` → find `tenant_llm_keys` for that provider
- [ ] Decrypt API key and pass to LlmService instead of using LiteLLM master key
- [ ] Add tenant LLM key management UI in Settings page

### P1 - Important (Core features fully working)

#### Knowledge Base Processing

- [ ] `apps/api/src/modules/knowledge/processors/` - Implement real file processors
- [ ] PDF: extract text via pdf-parse or similar
- [ ] DOCX: extract text via mammoth
- [ ] CSV: parse and chunk
- [ ] Create embeddings (OpenAI/Cohere embeddings API)
- [ ] Store embeddings in pgvector or separate vector DB
- [ ] Implement RAG retrieval in chat flow (retrieval-node in LangGraph)
- [ ] RabbitMQ consumer for `knowledge.process` queue (async processing)

#### Workflow Execution (currently mock)

- [ ] `apps/api/src/modules/workflows/workflow-engine.service.ts` - Convert workflow nodes/edges to LangGraph StateGraph
- [ ] Execute each node type: trigger → agent → condition → action → transform → output
- [ ] Handle conditional branching (if/else edges)
- [ ] Track execution per-node with logs
- [ ] RabbitMQ consumer for `workflow.execute` queue (async long-running workflows)
- [ ] SSE endpoint for real-time execution progress

#### Tool Executors Enhancement

- [ ] DB Query: real database connection pool management
- [ ] Code: Python execution via Docker container
- [ ] File Parser: PDF (pdf-parse) and DOCX (mammoth) support
- [ ] Email: real SMTP integration
- [ ] MCP: full Model Context Protocol implementation

#### FE-BE Integration Testing

- [ ] Test login → redirect → agent list flow
- [ ] Test create agent → preview chat (SSE) → save
- [ ] Test file upload (knowledge, avatar)
- [ ] Test tool CRUD and test panel
- [ ] Test workflow create/edit with React Flow

### P2 - Nice to Have

#### Redis Integration

- [ ] Cache agent configs in Redis for fast chat access
- [ ] Session cache for JWT
- [ ] API rate limiting per user/tenant
- [ ] Cache LLM responses (for identical prompts)

#### RabbitMQ Consumers

- [ ] `knowledge.process` - Async file processing worker
- [ ] `workflow.execute` - Async workflow execution worker
- [ ] `tool.execute` - Async tool execution (timeout-prone tools)
- [ ] `notification.send` - User notifications (email, in-app)

#### Tenant Management UI

- [ ] Settings page: manage tenant info, members, LLM keys
- [ ] Invite members via email
- [ ] Role management (owner, admin, member, viewer)
- [ ] LLM provider key management UI (add/edit/delete API keys)
- [ ] Usage dashboard (tokens used, costs, API calls)

#### Agent Marketplace / Sharing

- [ ] Public agent discovery page
- [ ] Share agent via link
- [ ] Clone public agents
- [ ] Agent ratings/reviews

### P3 - Future Enhancements

- [ ] WebSocket support for real-time collaboration
- [ ] Agent versioning UI (diff viewer, rollback)
- [ ] Workflow templates (pre-built workflow patterns)
- [ ] Multi-language support (i18n)
- [ ] Mobile responsive optimization
- [ ] Dark mode full support
- [ ] E2E testing (Playwright)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Kubernetes deployment configs
- [ ] Monitoring (Grafana + Prometheus)

---

## Detailed Plans

- [Frontend Plan](./FRONTEND_PLAN.md)
- [Backend Plan](./BACKEND_PLAN.md)
- [Services Plan](./SERVICES_PLAN.md)
- [Backend Design Patterns](./BACKEND_DESIGN_PATTERNS.md)

## Quick Start

```bash
# 1. Start services
docker-compose up -d

# 2. Install dependencies
npm install
cd apps/web && npm install
cd apps/api && npm install

# 3. Setup environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Start development
npm run dev:api   # Backend on :3001
npm run dev:web   # Frontend on :3000

# 5. Seed built-in tools
cd apps/api && npm run seed
```
