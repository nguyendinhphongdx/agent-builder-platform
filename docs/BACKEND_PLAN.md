# Backend Plan - NestJS API (`apps/api`)

## Architecture Rules

1. **Modular structure**: mỗi feature = 1 module trong `src/modules/`
2. **NestJS conventions**: Controller → Service → Repository/Entity
3. **LangGraph**: orchestration cho agent execution & workflow runtime
4. **JWT Auth**: access token + refresh token trên HttpOnly cookies
5. **TypeORM** cho database operations
6. **Event-driven**: RabbitMQ cho async tasks (file processing, workflow execution)

---

## Folder Structure

```
apps/api/
├── src/
│   ├── main.ts                           # Bootstrap NestJS app
│   ├── app.module.ts                     # Root module
│   │
│   ├── config/                           # Configuration
│   │   ├── database.config.ts            # TypeORM config
│   │   ├── redis.config.ts               # Redis config
│   │   ├── rabbitmq.config.ts            # RabbitMQ config
│   │   ├── jwt.config.ts                 # JWT config
│   │   ├── litellm.config.ts             # LiteLLM proxy config
│   │   └── cors.config.ts               # CORS settings
│   │
│   ├── common/                           # Shared utilities
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts # Extract user from request
│   │   │   └── public.decorator.ts       # Mark route as public
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts         # JWT authentication guard
│   │   │   └── roles.guard.ts            # Role-based access guard
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts  # Response transformation
│   │   │   └── logging.interceptor.ts    # Request logging
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts  # Global exception handler
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts        # DTO validation pipe
│   │   ├── dto/
│   │   │   └── pagination.dto.ts         # Shared pagination DTO
│   │   └── interfaces/
│   │       ├── api-response.interface.ts
│   │       └── jwt-payload.interface.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts        # login, register, refresh, logout
│   │   │   ├── auth.service.ts           # JWT logic, cookie management
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts       # Passport JWT strategy
│   │   │   │   └── jwt-refresh.strategy.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── refresh-token.dto.ts
│   │   │   └── entities/
│   │   │       └── refresh-token.entity.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   │
│   │   ├── agents/
│   │   │   ├── agents.module.ts
│   │   │   ├── agents.controller.ts      # CRUD + share + duplicate
│   │   │   ├── agents.service.ts         # Business logic
│   │   │   ├── agents.gateway.ts         # WebSocket/SSE for chat
│   │   │   ├── dto/
│   │   │   │   ├── create-agent.dto.ts
│   │   │   │   ├── update-agent.dto.ts
│   │   │   │   ├── query-agent.dto.ts    # Filter, pagination, search
│   │   │   │   ├── share-agent.dto.ts
│   │   │   │   └── chat-message.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── agent.entity.ts
│   │   │   │   ├── agent-knowledge.entity.ts  # Knowledge base files
│   │   │   │   ├── agent-tool.entity.ts       # Agent-Tool junction
│   │   │   │   ├── agent-collaborator.entity.ts # Agent collaboration
│   │   │   │   └── agent-share.entity.ts      # Sharing records
│   │   │   └── enums/
│   │   │       ├── agent-status.enum.ts
│   │   │       ├── agent-mode.enum.ts    # independent, collaborator, super_agent
│   │   │       └── agent-visibility.enum.ts
│   │   │
│   │   ├── chat/
│   │   │   ├── chat.module.ts
│   │   │   ├── chat.controller.ts        # SSE endpoint
│   │   │   ├── chat.service.ts           # Chat logic
│   │   │   ├── chat.gateway.ts           # Optional WebSocket
│   │   │   ├── dto/
│   │   │   │   ├── send-message.dto.ts
│   │   │   │   └── chat-session.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── chat-session.entity.ts
│   │   │   │   └── chat-message.entity.ts
│   │   │   └── langgraph/
│   │   │       ├── agent-graph.ts        # LangGraph agent graph
│   │   │       ├── nodes/
│   │   │       │   ├── llm-node.ts       # LLM call via LiteLLM
│   │   │       │   ├── tool-node.ts      # Tool execution node
│   │   │       │   ├── retrieval-node.ts # Knowledge retrieval
│   │   │       │   └── router-node.ts    # Route to sub-agents
│   │   │       └── state/
│   │   │           └── agent-state.ts    # LangGraph state definition
│   │   │
│   │   ├── tools/
│   │   │   ├── tools.module.ts
│   │   │   ├── tools.controller.ts       # CRUD tools
│   │   │   ├── tools.service.ts
│   │   │   ├── tool-executor.service.ts  # Execute tool by type
│   │   │   ├── dto/
│   │   │   │   ├── create-tool.dto.ts
│   │   │   │   ├── update-tool.dto.ts
│   │   │   │   └── test-tool.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── tool.entity.ts
│   │   │   ├── enums/
│   │   │   │   └── tool-type.enum.ts     # http, code, db_query, mcp, web_search, ...
│   │   │   └── executors/               # Strategy pattern per tool type
│   │   │       ├── http.executor.ts
│   │   │       ├── code.executor.ts
│   │   │       ├── db-query.executor.ts
│   │   │       ├── mcp-server.executor.ts
│   │   │       ├── web-search.executor.ts
│   │   │       └── file-parser.executor.ts
│   │   │
│   │   ├── workflows/
│   │   │   ├── workflows.module.ts
│   │   │   ├── workflows.controller.ts   # CRUD workflows
│   │   │   ├── workflows.service.ts
│   │   │   ├── workflow-engine.service.ts # Execute workflow via LangGraph
│   │   │   ├── dto/
│   │   │   │   ├── create-workflow.dto.ts
│   │   │   │   ├── update-workflow.dto.ts
│   │   │   │   └── execute-workflow.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── workflow.entity.ts
│   │   │   │   ├── workflow-node.entity.ts
│   │   │   │   ├── workflow-edge.entity.ts
│   │   │   │   └── workflow-execution.entity.ts
│   │   │   └── langgraph/
│   │   │       ├── workflow-graph.ts     # Convert workflow → LangGraph
│   │   │       └── node-handlers/
│   │   │           ├── agent-handler.ts
│   │   │           ├── condition-handler.ts
│   │   │           ├── action-handler.ts
│   │   │           └── transform-handler.ts
│   │   │
│   │   ├── knowledge/
│   │   │   ├── knowledge.module.ts
│   │   │   ├── knowledge.controller.ts   # Upload, list, delete files
│   │   │   ├── knowledge.service.ts      # File processing & indexing
│   │   │   ├── dto/
│   │   │   │   └── upload-knowledge.dto.ts
│   │   │   └── processors/
│   │   │       ├── pdf.processor.ts
│   │   │       ├── csv.processor.ts
│   │   │       ├── text.processor.ts
│   │   │       ├── json.processor.ts
│   │   │       └── docx.processor.ts
│   │   │
│   │   └── files/
│   │       ├── files.module.ts
│   │       ├── files.controller.ts       # File upload/download
│   │       └── files.service.ts          # Local/S3 file storage
│   │
│   └── database/
│       ├── migrations/                   # TypeORM migrations
│       └── seeds/                        # Seed data
│           ├── builtin-tools.seed.ts
│           └── demo-agents.seed.ts
│
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── .env
└── .env.example
```

---

## Database Schema (ERD)

### Design Principles
- **Multi-tenancy**: Mọi business entity đều có `tenant_id` để isolate data giữa các hệ thống
- **Soft delete**: `deleted_at` (nullable) thay vì xóa cứng, dễ restore & audit
- **Audit trail**: `created_by`, `updated_by` để track ai thay đổi gì
- **Versioning**: Agents & Workflows có `version` để track lịch sử thay đổi
- **Base columns**: Tất cả tables đều có `id`, `tenant_id`, `created_at`, `updated_at`, `deleted_at`

---

### Tenants (Multi-tenancy root)
```sql
tenants
├── id: UUID (PK)
├── name: VARCHAR                          -- Tên tổ chức/hệ thống
├── slug: VARCHAR UNIQUE                   -- URL-friendly identifier
├── logo_url: VARCHAR (nullable)
├── plan: ENUM('free','pro','enterprise')  -- Subscription plan
├── settings: JSONB                        -- Tenant-level settings
│   # { max_agents, max_workflows, max_storage_gb, allowed_models, ... }
├── owner_id: UUID (FK → users)           -- Người tạo tenant
├── is_active: BOOLEAN DEFAULT true
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
└── deleted_at: TIMESTAMP (nullable)       -- Soft delete
```

### Users & Membership
```sql
users
├── id: UUID (PK)
├── email: VARCHAR UNIQUE
├── password_hash: VARCHAR
├── full_name: VARCHAR
├── avatar_url: VARCHAR (nullable)
├── is_active: BOOLEAN DEFAULT true
├── last_login_at: TIMESTAMP (nullable)
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
└── deleted_at: TIMESTAMP (nullable)

tenant_members
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── user_id: UUID (FK → users)
├── role: ENUM('owner','admin','member','viewer')
├── invited_by: UUID (FK → users, nullable)
├── joined_at: TIMESTAMP
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
└── deleted_at: TIMESTAMP (nullable)
└── UNIQUE(tenant_id, user_id)

tenant_llm_keys                            -- Tenant config LLM provider keys
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── provider: VARCHAR                      -- 'openai', 'anthropic', 'google', 'azure', 'custom'
├── display_name: VARCHAR                  -- "OpenAI Production", "Anthropic"
├── api_key_encrypted: TEXT                -- AES-256 encrypted
├── base_url: VARCHAR (nullable)           -- Custom endpoint (Azure, self-hosted)
├── org_id: VARCHAR (nullable)             -- OpenAI org ID
├── is_default: BOOLEAN DEFAULT false      -- Default provider cho tenant
├── is_active: BOOLEAN DEFAULT true
├── models_available: VARCHAR[]            -- ['gpt-4o','gpt-4o-mini','gpt-3.5-turbo']
├── rate_limit: JSONB (nullable)           -- { rpm: 500, tpm: 100000 }
├── created_by: UUID (FK → users)
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
└── deleted_at: TIMESTAMP (nullable)
└── UNIQUE(tenant_id, provider, display_name)

api_keys
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── user_id: UUID (FK → users)            -- Ai tạo key
├── name: VARCHAR                          -- "Production Key", "Dev Key"
├── key_hash: VARCHAR                      -- Hashed API key
├── key_prefix: VARCHAR(8)                 -- First 8 chars for identification
├── scopes: JSONB                          -- ["agents:read","agents:write","chat:write"]
├── expires_at: TIMESTAMP (nullable)
├── last_used_at: TIMESTAMP (nullable)
├── is_active: BOOLEAN DEFAULT true
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
└── deleted_at: TIMESTAMP (nullable)
```

### Agents
```sql
agents
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)         -- ★ Multi-tenancy
├── name: VARCHAR
├── slug: VARCHAR                          -- URL-friendly, unique per tenant
├── description: TEXT
├── instructions: TEXT                     -- System prompt
├── avatar_url: VARCHAR (nullable)
├── icon: VARCHAR (nullable)               -- Emoji hoặc icon name
├── status: ENUM('draft','active','archived')
├── mode: ENUM('independent','collaborator','super_agent')
├── visibility: ENUM('private','shared','public')
├── version: INT DEFAULT 1                 -- Version tracking
├── model_config: JSONB
│   # {
│   #   provider: "openai",           -- chọn từ tenant_llm_keys available
│   #   model: "gpt-4o",
│   #   temperature: 0.7,
│   #   max_tokens: 4096,
│   #   top_p: 1,
│   #   frequency_penalty: 0,
│   #   presence_penalty: 0,
│   #   stop_sequences: [],
│   #   response_format: null
│   # }
├── welcome_message: TEXT (nullable)       -- Tin nhắn chào mừng
├── tags: VARCHAR[] (nullable)             -- Tags để filter/search
├── metadata: JSONB (nullable)             -- Custom metadata
├── usage_count: INT DEFAULT 0             -- Đếm số lần sử dụng
├── creator_id: UUID (FK → users)
├── created_by: UUID (FK → users)
├── updated_by: UUID (FK → users, nullable)
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
├── deleted_at: TIMESTAMP (nullable)
└── UNIQUE(tenant_id, slug)

agent_versions                             -- Lưu lịch sử version
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── agent_id: UUID (FK → agents)
├── version: INT
├── snapshot: JSONB                        -- Full agent config snapshot
├── change_note: TEXT (nullable)           -- Ghi chú thay đổi
├── created_by: UUID (FK → users)
├── created_at: TIMESTAMP
└── INDEX(agent_id, version)

agent_knowledge
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── agent_id: UUID (FK → agents)
├── file_name: VARCHAR
├── file_type: VARCHAR                     -- pdf, txt, csv, json, md, docx
├── file_size: BIGINT                      -- Bytes
├── file_url: VARCHAR                      -- Storage path/URL
├── content_hash: VARCHAR                  -- SHA-256 để detect duplicate
├── status: ENUM('pending','processing','ready','failed')
├── chunks_count: INT DEFAULT 0
├── error_message: TEXT (nullable)         -- Lỗi khi processing
├── processed_at: TIMESTAMP (nullable)
├── created_by: UUID (FK → users)
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
└── deleted_at: TIMESTAMP (nullable)

agent_tools (junction)
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── agent_id: UUID (FK → agents)
├── tool_id: UUID (FK → tools)
├── config_override: JSONB (nullable)      -- Override tool config per agent
├── is_enabled: BOOLEAN DEFAULT true       -- Bật/tắt tool cho agent
├── sort_order: INT DEFAULT 0              -- Thứ tự ưu tiên
├── created_at: TIMESTAMP
└── UNIQUE(agent_id, tool_id)

agent_collaborators
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── parent_agent_id: UUID (FK → agents)    -- Super agent
├── child_agent_id: UUID (FK → agents)     -- Collaborator agent
├── role: VARCHAR                          -- helper, reviewer, specialist, router
├── description: TEXT (nullable)           -- Mô tả vai trò
├── delegation_rules: JSONB (nullable)     -- Khi nào delegate cho agent này
│   # { trigger_keywords: [], conditions: [], priority: 1 }
├── sort_order: INT DEFAULT 0
├── is_active: BOOLEAN DEFAULT true
├── created_by: UUID (FK → users)
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
└── deleted_at: TIMESTAMP (nullable)
└── UNIQUE(parent_agent_id, child_agent_id)

agent_shares
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── agent_id: UUID (FK → agents)
├── shared_with_user_id: UUID (FK → users, nullable)   -- Share với user cụ thể
├── shared_with_tenant_id: UUID (FK → tenants, nullable) -- Share với tenant khác
├── permission: ENUM('view','use','edit','admin')
├── shared_by: UUID (FK → users)
├── expires_at: TIMESTAMP (nullable)       -- Hết hạn share
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
└── deleted_at: TIMESTAMP (nullable)
```

### Tools
```sql
tools
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants, nullable) -- NULL = builtin (system-wide)
├── name: VARCHAR
├── slug: VARCHAR
├── description: TEXT
├── type: ENUM('http','code','db_query','mcp_server','web_search','file_parser','email','webhook')
├── is_builtin: BOOLEAN DEFAULT false      -- true = tool hệ thống
├── category: VARCHAR (nullable)           -- "communication", "data", "ai", ...
├── config: JSONB
│   # HTTP:       { url, method, headers, body_template, auth_type, auth_config, timeout_ms }
│   # Code:       { language, code_template, runtime, timeout_ms, memory_limit_mb }
│   # DB Query:   { db_type, connection_ref, query_template, read_only, timeout_ms }
│   # MCP Server: { server_url, transport, capabilities, auth_config }
│   # Web Search: { engine, max_results, safe_search }
│   # File Parser: { supported_formats, max_file_size_mb, parse_mode }
│   # Email:      { provider, from_template, subject_template, body_template }
│   # Webhook:    { url, method, headers, payload_template, secret, retry_count }
├── input_schema: JSONB (nullable)         -- JSON Schema cho input parameters
├── output_schema: JSONB (nullable)        -- JSON Schema cho output
├── icon: VARCHAR
├── is_active: BOOLEAN DEFAULT true
├── version: INT DEFAULT 1
├── credentials_ref: VARCHAR (nullable)    -- Reference đến encrypted credentials
├── rate_limit: JSONB (nullable)           -- { max_calls_per_minute, max_calls_per_hour }
├── usage_count: INT DEFAULT 0
├── creator_id: UUID (FK → users, nullable)
├── created_by: UUID (FK → users, nullable)
├── updated_by: UUID (FK → users, nullable)
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
└── deleted_at: TIMESTAMP (nullable)
└── UNIQUE(tenant_id, slug) WHERE tenant_id IS NOT NULL

tool_credentials                           -- Encrypted credentials cho tools
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── name: VARCHAR                          -- "OpenAI API Key", "DB Password"
├── type: ENUM('api_key','oauth2','basic','bearer','custom')
├── encrypted_value: TEXT                  -- AES-256 encrypted
├── metadata: JSONB (nullable)             -- Non-sensitive metadata
├── expires_at: TIMESTAMP (nullable)
├── created_by: UUID (FK → users)
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
└── deleted_at: TIMESTAMP (nullable)
```

### Workflows
```sql
workflows
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── name: VARCHAR
├── slug: VARCHAR
├── description: TEXT
├── status: ENUM('draft','active','archived')
├── version: INT DEFAULT 1
├── tags: VARCHAR[] (nullable)
├── trigger_config: JSONB (nullable)       -- Auto-trigger settings
│   # { type: 'schedule'|'webhook'|'event', config: {...} }
├── variables: JSONB (nullable)            -- Workflow-level variables
├── viewport: JSONB (nullable)             -- React Flow viewport state
│   # { x, y, zoom }
├── creator_id: UUID (FK → users)
├── created_by: UUID (FK → users)
├── updated_by: UUID (FK → users, nullable)
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
└── deleted_at: TIMESTAMP (nullable)
└── UNIQUE(tenant_id, slug)

workflow_nodes
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── workflow_id: UUID (FK → workflows)
├── type: ENUM('trigger','agent','condition','action','transform','output','delay','loop','parallel')
├── label: VARCHAR
├── description: TEXT (nullable)
├── position_x: FLOAT
├── position_y: FLOAT
├── width: FLOAT (nullable)               -- Custom node size
├── height: FLOAT (nullable)
├── config: JSONB
│   # trigger:   { type: 'http'|'schedule'|'manual'|'webhook', config: {...} }
│   # agent:     { agent_id, input_mapping, output_mapping, timeout_ms }
│   # condition: { rules: [{ field, operator, value }], logic: 'and'|'or' }
│   # action:    { tool_id, params_mapping, retry_config }
│   # transform: { code, language, input_schema, output_schema }
│   # output:    { format, destination, template }
│   # delay:     { duration_ms, until_condition }
│   # loop:      { max_iterations, break_condition }
│   # parallel:  { strategy: 'all'|'race'|'any', timeout_ms }
├── style: JSONB (nullable)                -- Visual styling
│   # { backgroundColor, borderColor, icon }
├── sort_order: INT DEFAULT 0
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP

workflow_edges
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── workflow_id: UUID (FK → workflows)
├── source_node_id: UUID (FK → workflow_nodes)
├── target_node_id: UUID (FK → workflow_nodes)
├── source_handle: VARCHAR (nullable)      -- Output handle name (for conditions)
├── target_handle: VARCHAR (nullable)      -- Input handle name
├── label: VARCHAR (nullable)              -- Edge label ("yes", "no", "error")
├── condition: JSONB (nullable)            -- Edge-level condition
│   # { field, operator, value }
├── style: JSONB (nullable)                -- Visual styling
│   # { strokeColor, animated, type: 'default'|'step'|'smoothstep' }
├── sort_order: INT DEFAULT 0
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP

workflow_executions
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── workflow_id: UUID (FK → workflows)
├── workflow_version: INT                  -- Version tại thời điểm execute
├── status: ENUM('pending','running','completed','failed','cancelled','timeout')
├── trigger_type: VARCHAR                  -- manual, schedule, webhook, api
├── input: JSONB
├── output: JSONB (nullable)
├── variables: JSONB (nullable)            -- Runtime variables
├── error: JSONB (nullable)
│   # { message, node_id, stack_trace, code }
├── duration_ms: INT (nullable)
├── total_tokens_used: INT DEFAULT 0       -- Tổng tokens LLM sử dụng
├── total_cost: DECIMAL(10,6) DEFAULT 0    -- Tổng chi phí LLM
├── triggered_by: UUID (FK → users, nullable)
├── started_at: TIMESTAMP
├── completed_at: TIMESTAMP (nullable)
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP

workflow_execution_logs                    -- Chi tiết execution từng node
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── execution_id: UUID (FK → workflow_executions)
├── node_id: UUID (FK → workflow_nodes)
├── status: ENUM('pending','running','completed','failed','skipped')
├── input: JSONB (nullable)
├── output: JSONB (nullable)
├── error: TEXT (nullable)
├── duration_ms: INT (nullable)
├── tokens_used: INT DEFAULT 0
├── retry_count: INT DEFAULT 0
├── started_at: TIMESTAMP
├── completed_at: TIMESTAMP (nullable)
├── created_at: TIMESTAMP
└── INDEX(execution_id, node_id)
```

### Chat
```sql
chat_sessions
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── agent_id: UUID (FK → agents)
├── user_id: UUID (FK → users)
├── title: VARCHAR
├── is_preview: BOOLEAN DEFAULT false      -- true = chat trong agent builder
├── status: ENUM('active','archived','deleted')
├── context: JSONB (nullable)              -- Session-level context/variables
├── total_messages: INT DEFAULT 0
├── total_tokens: INT DEFAULT 0
├── last_message_at: TIMESTAMP (nullable)
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
└── deleted_at: TIMESTAMP (nullable)

chat_messages
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── session_id: UUID (FK → chat_sessions)
├── parent_message_id: UUID (FK → chat_messages, nullable) -- Thread/branch
├── role: ENUM('user','assistant','system','tool')
├── content: TEXT
├── content_type: ENUM('text','markdown','code','image','file') DEFAULT 'text'
├── metadata: JSONB (nullable)
│   # {
│   #   model: "gpt-4o",
│   #   tokens: { prompt: 100, completion: 50, total: 150 },
│   #   cost: 0.005,
│   #   tool_calls: [{ id, name, args, result }],
│   #   latency_ms: 1200,
│   #   finish_reason: "stop"
│   # }
├── feedback: JSONB (nullable)             -- User feedback
│   # { rating: 'up'|'down', comment: "..." }
├── created_at: TIMESTAMP
├── updated_at: TIMESTAMP
└── deleted_at: TIMESTAMP (nullable)
└── INDEX(session_id, created_at)
```

### Audit & Activity
```sql
audit_logs                                 -- Track mọi thao tác quan trọng
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── user_id: UUID (FK → users, nullable)   -- NULL = system action
├── action: VARCHAR                        -- 'agent.create', 'tool.delete', 'workflow.execute'
├── entity_type: VARCHAR                   -- 'agent', 'tool', 'workflow', 'user'
├── entity_id: UUID
├── changes: JSONB (nullable)              -- { before: {...}, after: {...} }
├── ip_address: VARCHAR (nullable)
├── user_agent: TEXT (nullable)
├── created_at: TIMESTAMP
└── INDEX(tenant_id, entity_type, entity_id)
└── INDEX(tenant_id, created_at)

usage_metrics                              -- Track usage cho billing/analytics
├── id: UUID (PK)
├── tenant_id: UUID (FK → tenants)
├── metric_type: ENUM('llm_tokens','api_calls','storage_bytes','workflow_runs')
├── metric_value: BIGINT
├── model_name: VARCHAR (nullable)         -- Nếu là llm_tokens
├── agent_id: UUID (nullable)
├── recorded_date: DATE                    -- Aggregate theo ngày
├── created_at: TIMESTAMP
└── INDEX(tenant_id, metric_type, recorded_date)
```

### Entity Relationship Diagram

```
tenants ─────────────────────────────────────────────────────────┐
  │ 1:N                                                          │
  ├── tenant_members ── N:1 ── users                             │
  │                              │ 1:N                           │
  ├── agents ────────────────────┤                               │
  │     │ 1:N                    │                               │
  │     ├── agent_versions       │                               │
  │     ├── agent_knowledge      │                               │
  │     ├── agent_tools ── N:1 ── tools                          │
  │     ├── agent_collaborators (self-ref agents)                │
  │     ├── agent_shares                                         │
  │     └── chat_sessions                                        │
  │           └── chat_messages                                  │
  │                                                              │
  ├── tools                                                      │
  │     └── tool_credentials                                     │
  │                                                              │
  ├── workflows                                                  │
  │     ├── workflow_nodes                                       │
  │     ├── workflow_edges                                       │
  │     └── workflow_executions                                  │
  │           └── workflow_execution_logs                         │
  │                                                              │
  ├── audit_logs                                                 │
  ├── usage_metrics                                              │
  └── api_keys                                                   │
```

### Indexes Strategy

```sql
-- Performance indexes
CREATE INDEX idx_agents_tenant_status ON agents(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_tenant_visibility ON agents(tenant_id, visibility) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_creator ON agents(tenant_id, creator_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_tags ON agents USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_search ON agents USING GIN(to_tsvector('english', name || ' ' || description));

CREATE INDEX idx_tools_tenant_type ON tools(tenant_id, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_tools_builtin ON tools(is_builtin) WHERE deleted_at IS NULL;

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_chat_sessions_agent ON chat_sessions(tenant_id, agent_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_workflow_exec_status ON workflow_executions(tenant_id, status, created_at);
CREATE INDEX idx_audit_entity ON audit_logs(tenant_id, entity_type, entity_id, created_at);
CREATE INDEX idx_usage_date ON usage_metrics(tenant_id, metric_type, recorded_date);
```

---

## API Endpoints

### Auth
```
POST   /api/auth/register        # Register new user
POST   /api/auth/login            # Login → set cookies
POST   /api/auth/refresh          # Refresh access token
POST   /api/auth/logout           # Clear cookies
GET    /api/auth/me               # Get current user
```

### Agents
```
GET    /api/agents                # List agents (with filters)
GET    /api/agents/:id            # Get agent detail
POST   /api/agents                # Create agent
PUT    /api/agents/:id            # Update agent
DELETE /api/agents/:id            # Delete agent
POST   /api/agents/:id/duplicate  # Duplicate agent
POST   /api/agents/:id/share      # Share agent with users
GET    /api/agents/:id/collaborators  # Get collaborators
POST   /api/agents/:id/collaborators  # Add collaborator
DELETE /api/agents/:id/collaborators/:collabId  # Remove collaborator
```

### Chat (SSE)
```
POST   /api/chat/sessions                  # Create chat session
GET    /api/chat/sessions/:id/messages     # Get chat history
POST   /api/chat/sessions/:id/messages     # Send message (returns SSE stream)
DELETE /api/chat/sessions/:id              # Delete session
```

### Tools
```
GET    /api/tools                 # List tools (builtin + custom)
GET    /api/tools/:id             # Get tool detail
POST   /api/tools                 # Create custom tool
PUT    /api/tools/:id             # Update tool
DELETE /api/tools/:id             # Delete tool
POST   /api/tools/:id/test       # Test tool execution
```

### Knowledge
```
POST   /api/agents/:id/knowledge          # Upload knowledge file(s)
GET    /api/agents/:id/knowledge          # List knowledge files
DELETE /api/agents/:id/knowledge/:fileId  # Delete knowledge file
```

### Workflows
```
GET    /api/workflows             # List workflows
GET    /api/workflows/:id         # Get workflow with nodes/edges
POST   /api/workflows             # Create workflow
PUT    /api/workflows/:id         # Update workflow (nodes, edges, config)
DELETE /api/workflows/:id         # Delete workflow
POST   /api/workflows/:id/execute # Execute workflow
GET    /api/workflows/:id/executions  # Get execution history
GET    /api/workflows/executions/:execId  # Get execution detail
```

### Files
```
POST   /api/files/upload          # Upload file (avatar, knowledge, etc.)
GET    /api/files/:id             # Download/stream file
DELETE /api/files/:id             # Delete file
```

---

## SSE Chat Flow (with LangGraph)

```
Client                          Server
  │                                │
  │  POST /chat/sessions/:id/messages
  │  { content: "Hello" }         │
  │  ─────────────────────────────►│
  │                                │
  │  SSE Stream opens              │
  │  ◄─────────────────────────────│
  │                                │
  │  event: start                  │  ← LangGraph graph starts
  │  data: { sessionId }          │
  │  ◄─────────────────────────────│
  │                                │
  │  event: token                  │  ← LLM streaming tokens
  │  data: { delta: "Hi" }       │     via LiteLLM
  │  ◄─────────────────────────────│
  │                                │
  │  event: token                  │
  │  data: { delta: " there" }   │
  │  ◄─────────────────────────────│
  │                                │
  │  event: tool_call              │  ← Agent decides to use tool
  │  data: { tool, args }        │
  │  ◄─────────────────────────────│
  │                                │
  │  event: tool_result            │  ← Tool execution result
  │  data: { result }            │
  │  ◄─────────────────────────────│
  │                                │
  │  event: token                  │  ← Continue LLM response
  │  data: { delta: "Based on" } │
  │  ◄─────────────────────────────│
  │                                │
  │  event: done                   │  ← Graph complete
  │  data: { usage, totalTokens } │
  │  ◄─────────────────────────────│
```

---

## LangGraph Integration

### Agent Execution Graph
```
                    ┌──────────┐
                    │  START   │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
              ┌─────│ LLM Node │─────┐
              │     └──────────┘     │
              │                      │
        (has tool call)        (no tool call)
              │                      │
        ┌─────▼─────┐         ┌─────▼─────┐
        │ Tool Node │         │   END     │
        └─────┬─────┘         └───────────┘
              │
              │ (tool result)
              │
        ┌─────▼─────┐
        │ LLM Node  │ ← loop back with tool result
        └───────────┘

For Super Agent mode:
        ┌──────────┐
        │  Router  │ ← decides which sub-agent to call
        └────┬─────┘
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
 Agent A  Agent B  Agent C
    │        │        │
    └────────┼────────┘
             ▼
        ┌──────────┐
        │ Combiner │ ← merge results
        └──────────┘
```

### Workflow Execution
```
WorkflowEngine converts workflow nodes/edges → LangGraph StateGraph
Each node type maps to a LangGraph node function
Edges with conditions map to conditional_edges
Execution state flows through the graph
```
