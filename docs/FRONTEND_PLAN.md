# Frontend Plan - Next.js App (`apps/web`)

## Architecture Rules

1. **App Router pages CHỈ import components từ `features/`** - không viết logic/UI trực tiếp trong page
2. **Mỗi feature có cấu trúc chuẩn**: `hooks/`, `services/`, `components/`, `pages/`
3. **Zustand** cho client state, **TanStack Query** cho server state (cache, fetch, mutate)
4. **Axios instance** tự động refresh token khi gặp 401

---

## Folder Structure

```
apps/web/
├── public/
│   ├── icons/                    # Agent icon options
│   └── images/
├── src/
│   ├── app/                      # Next.js App Router (thin layer)
│   │   ├── layout.tsx            # Root layout → import AppShell
│   │   ├── page.tsx              # Redirect to /agents
│   │   ├── login/
│   │   │   └── page.tsx          # → <LoginPage />
│   │   ├── agents/
│   │   │   ├── page.tsx          # → <AgentLibraryPage />
│   │   │   ├── create/
│   │   │   │   └── page.tsx      # → <AgentCreatePage />
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx  # → <AgentEditPage />
│   │   ├── workflows/
│   │   │   ├── page.tsx          # → <WorkflowListPage />
│   │   │   ├── create/
│   │   │   │   └── page.tsx      # → <WorkflowCreatePage />
│   │   │   └── [id]/
│   │   │       └── page.tsx      # → <WorkflowEditorPage />
│   │   ├── tools/
│   │   │   ├── page.tsx          # → <ToolListPage />
│   │   │   └── create/
│   │   │       └── page.tsx      # → <ToolCreatePage />
│   │   └── settings/
│   │       └── page.tsx          # → <SettingsPage />
│   │
│   ├── features/                 # Feature modules (core logic lives here)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── AuthGuard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useUser.ts
│   │   │   ├── services/
│   │   │   │   └── authService.ts
│   │   │   └── pages/
│   │   │       └── LoginPage.tsx
│   │   │
│   │   ├── agents/
│   │   │   ├── components/
│   │   │   │   ├── AgentForm.tsx           # Form tạo/sửa agent
│   │   │   │   ├── AgentCard.tsx           # Card hiển thị agent
│   │   │   │   ├── AgentGrid.tsx           # Grid/List view
│   │   │   │   ├── AgentFilters.tsx        # Tabs + Search + Sort
│   │   │   │   ├── AgentActions.tsx        # 3-dot dropdown menu
│   │   │   │   ├── AvatarUpload.tsx        # Upload avatar hoặc chọn icon
│   │   │   │   ├── KnowledgeUpload.tsx     # Drag & drop knowledge base
│   │   │   │   ├── InstructionEditor.tsx   # Instruction textarea/editor
│   │   │   │   ├── ToolSelector.tsx        # Chọn tools cho agent
│   │   │   │   ├── CollaboratorSettings.tsx # Cấu hình collaboration
│   │   │   │   ├── AgentSettingsTabs.tsx   # Tabs setting trong form
│   │   │   │   └── AgentPreviewChat.tsx    # Chat preview panel (SSE)
│   │   │   ├── hooks/
│   │   │   │   ├── useAgents.ts            # TanStack Query - list agents
│   │   │   │   ├── useAgent.ts             # TanStack Query - single agent
│   │   │   │   ├── useCreateAgent.ts       # TanStack Mutation - create
│   │   │   │   ├── useUpdateAgent.ts       # TanStack Mutation - update
│   │   │   │   ├── useDeleteAgent.ts       # TanStack Mutation - delete
│   │   │   │   └── useAgentChat.ts         # SSE chat hook
│   │   │   ├── services/
│   │   │   │   ├── agentService.ts         # Axios API calls
│   │   │   │   └── chatService.ts          # SSE connection handler
│   │   │   └── pages/
│   │   │       ├── AgentLibraryPage.tsx     # Trang thư viện agent
│   │   │       ├── AgentCreatePage.tsx      # Trang tạo agent (split screen)
│   │   │       └── AgentEditPage.tsx        # Trang sửa agent (pre-filled)
│   │   │
│   │   ├── workflows/
│   │   │   ├── components/
│   │   │   │   ├── WorkflowCanvas.tsx      # React Flow canvas
│   │   │   │   ├── WorkflowToolbar.tsx     # Toolbar (save, run, zoom)
│   │   │   │   ├── WorkflowSidebar.tsx     # Node palette sidebar
│   │   │   │   ├── WorkflowCard.tsx        # Workflow card in list
│   │   │   │   ├── NodeConfigPanel.tsx     # Side panel to config node
│   │   │   │   └── nodes/                  # Custom React Flow nodes
│   │   │   │       ├── TriggerNode.tsx     # Start/Trigger node
│   │   │   │       ├── AgentNode.tsx       # Agent execution node
│   │   │   │       ├── ConditionNode.tsx   # If/Else branching
│   │   │   │       ├── ActionNode.tsx      # Action (API call, tool)
│   │   │   │       ├── TransformNode.tsx   # Data transform node
│   │   │   │       └── OutputNode.tsx      # End/Output node
│   │   │   ├── hooks/
│   │   │   │   ├── useWorkflows.ts
│   │   │   │   ├── useWorkflow.ts
│   │   │   │   ├── useCreateWorkflow.ts
│   │   │   │   ├── useUpdateWorkflow.ts
│   │   │   │   └── useWorkflowExecution.ts
│   │   │   ├── services/
│   │   │   │   └── workflowService.ts
│   │   │   └── pages/
│   │   │       ├── WorkflowListPage.tsx
│   │   │       ├── WorkflowCreatePage.tsx
│   │   │       └── WorkflowEditorPage.tsx
│   │   │
│   │   ├── tools/
│   │   │   ├── components/
│   │   │   │   ├── ToolForm.tsx            # Create/Edit tool form
│   │   │   │   ├── ToolCard.tsx            # Tool card in list
│   │   │   │   ├── ToolList.tsx            # Tool list view
│   │   │   │   ├── ToolTypeSelector.tsx    # Tool type picker
│   │   │   │   ├── ToolTestPanel.tsx       # Test tool execution
│   │   │   │   └── configs/               # Type-specific config forms
│   │   │   │       ├── HttpToolConfig.tsx
│   │   │   │       ├── CodeToolConfig.tsx
│   │   │   │       ├── DbQueryToolConfig.tsx
│   │   │   │       ├── McpServerToolConfig.tsx
│   │   │   │       ├── WebSearchToolConfig.tsx
│   │   │   │       └── FileParserToolConfig.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useTools.ts
│   │   │   │   ├── useTool.ts
│   │   │   │   ├── useCreateTool.ts
│   │   │   │   ├── useUpdateTool.ts
│   │   │   │   └── useDeleteTool.ts
│   │   │   ├── services/
│   │   │   │   └── toolService.ts
│   │   │   └── pages/
│   │   │       ├── ToolListPage.tsx
│   │   │       └── ToolCreatePage.tsx
│   │   │
│   │   └── layout/
│   │       ├── components/
│   │       │   ├── AppShell.tsx            # Main layout wrapper
│   │       │   ├── Sidebar.tsx             # Left navigation sidebar
│   │       │   ├── SidebarItem.tsx         # Nav item component
│   │       │   ├── Header.tsx              # Top header bar
│   │       │   └── UserMenu.tsx            # User avatar + dropdown
│   │       └── hooks/
│   │           └── useSidebar.ts
│   │
│   ├── libs/                     # Shared libraries & configs
│   │   ├── axios.ts              # Axios instance + interceptors
│   │   ├── queryClient.ts        # TanStack Query client config
│   │   ├── constants.ts          # App-wide constants
│   │   └── cn.ts                 # clsx + tailwind-merge helper
│   │
│   ├── helpers/                  # Pure utility functions
│   │   ├── formatDate.ts
│   │   ├── formatFileSize.ts
│   │   ├── validators.ts         # Form validation helpers
│   │   └── fileUtils.ts          # File type checking, etc.
│   │
│   ├── stores/                   # Zustand stores (client-only state)
│   │   ├── uiStore.ts            # Sidebar open, theme, modals
│   │   ├── agentFormStore.ts     # Agent form draft state
│   │   └── workflowStore.ts      # Workflow editor state (nodes, edges)
│   │
│   ├── types/                    # Shared TypeScript types
│   │   ├── agent.ts
│   │   ├── tool.ts
│   │   ├── workflow.ts
│   │   ├── chat.ts
│   │   ├── auth.ts
│   │   └── common.ts             # Pagination, API response wrapper
│   │
│   └── components/               # Shadcn/UI components (global reusable)
│       └── ui/
│           ├── button.tsx
│           ├── input.tsx
│           ├── textarea.tsx
│           ├── tabs.tsx
│           ├── dialog.tsx
│           ├── dropdown-menu.tsx
│           ├── badge.tsx
│           ├── card.tsx
│           ├── avatar.tsx
│           ├── select.tsx
│           ├── switch.tsx
│           ├── separator.tsx
│           ├── scroll-area.tsx
│           ├── tooltip.tsx
│           ├── sheet.tsx
│           ├── popover.tsx
│           ├── command.tsx
│           ├── checkbox.tsx
│           ├── label.tsx
│           ├── slider.tsx
│           ├── skeleton.tsx
│           ├── toast.tsx
│           └── toaster.tsx
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── postcss.config.js
├── .env.local
└── .env.example
```

---

## Axios Instance (`src/libs/axios.ts`)

```typescript
// Tạo axios instance với baseURL từ env
// Request interceptor: không cần gắn token vì JWT nằm trên HttpOnly cookie
// Response interceptor:
//   - 401 → gọi POST /api/auth/refresh
//   - Refresh thành công → retry request gốc
//   - Refresh thất bại → redirect /login, clear state
//   - Dùng flag isRefreshing + queue để tránh gọi refresh nhiều lần
```

### Cơ chế Refresh Token:

```
┌─────────┐     Request      ┌─────────┐
│  Client  │ ───────────────► │  Server │
│ (Axios)  │                  │ (API)   │
└─────────┘                   └─────────┘
     │                             │
     │  ◄── 401 Unauthorized ──── │
     │                             │
     │  POST /auth/refresh ──────► │
     │  (refresh_token cookie)     │
     │                             │
     │  ◄── 200 + new cookies ─── │
     │                             │
     │  Retry original request ──► │
     │                             │
     │  ◄── 200 Success ──────── │
```

---

## Page Pattern (App Router)

Mỗi page trong `app/` chỉ là thin wrapper:

```typescript
// app/agents/page.tsx
import { AgentLibraryPage } from '@/features/agents/pages/AgentLibraryPage'

export default function Page() {
  return <AgentLibraryPage />
}
```

---

## Key Pages Detail

### 1. Agent Library Page (`AgentLibraryPage`)

```
┌──────────────────────────────────────────────────────┐
│  Header: "Agents"                    [+ Create Agent] │
├──────────────────────────────────────────────────────┤
│  [All] [My Agents] [Shared] [Public]    🔍 Search... │
│  Sort: [Recent ▼]  View: [Grid] [List]               │
├──────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │ Avatar  •••│ Avatar  •••│ Avatar  •••│             │
│  │         │  │         │  │         │               │
│  │ Agent 1 │  │ Agent 2 │  │ Agent 3 │               │
│  │ Desc... │  │ Desc... │  │ Desc... │               │
│  │ 🟢 Active│  │ ⚪ Draft │  │ 🟢 Active│              │
│  │ By: user│  │ By: user│  │ By: team│               │
│  │ #tag1   │  │ #tag2   │  │ #tag3   │               │
│  └─────────┘  └─────────┘  └─────────┘              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │  ...    │  │  ...    │  │  ...    │               │
│  └─────────┘  └─────────┘  └─────────┘              │
└──────────────────────────────────────────────────────┘

3-dot menu actions:
  - Edit
  - Duplicate
  - Share (→ dialog chọn users/teams)
  - Export as JSON
  - Delete (→ confirm dialog)
```

### 2. Agent Builder Page (`AgentCreatePage` / `AgentEditPage`)

```
┌─────────────────────────────────┬────────────────────┐
│  ◄ Back    Agent Builder   Save │  Preview Chat      │
├─────────────────────────────────┤                    │
│                                 │  ┌──────────────┐  │
│  [Avatar Upload / Icon Picker]  │  │ Agent Avatar  │  │
│                                 │  │ Agent Name    │  │
│  Name: [________________]       │  └──────────────┘  │
│  Description: [__________]      │                    │
│                                 │  User: Hello!      │
│  ─── Instructions ───           │                    │
│  [                        ]     │  Agent: Hi! I'm... │
│  [   System prompt area   ]     │  (streaming SSE)   │
│  [                        ]     │                    │
│                                 │  User: What can    │
│  ─── Knowledge Base ───         │  you do?           │
│  ┌─────────────────────┐       │                    │
│  │  📁 Drag & Drop     │       │  Agent: I can...   │
│  │  or Click to Upload  │       │                    │
│  │  PDF,TXT,CSV,JSON,MD │       │                    │
│  └─────────────────────┘       │                    │
│  📄 doc1.pdf  ✕                 │                    │
│  📄 data.csv  ✕                 │                    │
│                                 │  ┌──────────────┐  │
│  ─── Tools ───                  │  │ Type message  │  │
│  [Built-in] [My Tools]          │  │          [▶]  │  │
│  ☑ Web Search                   │  └──────────────┘  │
│  ☑ DB Query                     │  [Reset Chat]      │
│  ☐ Code Executor                │                    │
│                                 │                    │
│  ─── Settings ───               │                    │
│  [General] [Collaboration] [Permissions]             │
│                                 │                    │
│  Mode: ○ Independent            │                    │
│        ○ Collaborator           │                    │
│        ○ Super Agent            │                    │
│                                 │                    │
│  Collaborators: [+ Add Agent]   │                    │
│  • Agent A (helper)    ✕        │                    │
│  • Agent B (reviewer)  ✕        │                    │
├─────────────────────────────────┤                    │
│  [Cancel]              [Save]   │                    │
└─────────────────────────────────┴────────────────────┘
```

### 3. Workflow Builder Page

```
┌────────────────────────────────────────────────────────────┐
│  ◄ Back    Workflow: "Customer Support Flow"    [Save][Run]│
├────────┬───────────────────────────────────────┬───────────┤
│ Nodes  │                                       │  Config   │
│        │          React Flow Canvas             │  Panel    │
│ ▸Trigger│    ┌───────┐     ┌──────────┐        │           │
│ ▸Agent │    │Trigger│────►│ Agent:   │        │ Node: X   │
│ ▸Cond  │    │ HTTP  │     │ Classify │        │           │
│ ▸Action│    └───────┘     └──────────┘        │ Type: Agent│
│ ▸Trans │                   │        │          │ Select:   │
│ ▸Output│              ┌────┘        └────┐     │ [Agent ▼] │
│        │         ┌────▼───┐      ┌───▼───┐    │           │
│        │         │Condition│     │Cond   │    │ Input:    │
│        │         │Priority │     │Topic  │    │ {{prev}}  │
│        │         └────┬───┘      └───┬───┘    │           │
│        │         ┌────▼───┐      ┌───▼───┐    │ Output:   │
│        │         │ Agent: │      │Agent: │    │ {{result}}│
│        │         │ VIP    │      │General│    │           │
│        │         └────┬───┘      └───┬───┘    │           │
│        │              └──────┬───────┘         │           │
│        │              ┌──────▼──────┐          │           │
│        │              │   Output    │          │           │
│        │              │   Response  │          │           │
│        │              └─────────────┘          │           │
├────────┴───────────────────────────────────────┴───────────┤
│  MiniMap   Zoom: [-][100%][+]   Nodes: 7   Edges: 8       │
└────────────────────────────────────────────────────────────┘
```

### 4. Tools Management Page

```
┌──────────────────────────────────────────────────────┐
│  Tools                               [+ Create Tool]  │
├──────────────────────────────────────────────────────┤
│  [All] [Built-in] [Custom] [HTTP] [Code] [DB] [MCP]  │
│  🔍 Search tools...                                   │
├──────────────────────────────────────────────────────┤
│  BUILT-IN TOOLS                                       │
│  ┌────────────────────────────────────────┐           │
│  │ 🌐 Web Search           [Enabled ✓]   │           │
│  │ Search the web via Google/Bing API     │           │
│  │ Type: HTTP  │  Used by: 12 agents      │           │
│  └────────────────────────────────────────┘           │
│  ┌────────────────────────────────────────┐           │
│  │ 🗃️ Database Query        [Enabled ✓]   │           │
│  │ Execute SQL on connected databases     │           │
│  │ Type: DB Query │ Used by: 5 agents     │           │
│  └────────────────────────────────────────┘           │
│                                                       │
│  CUSTOM TOOLS                                         │
│  ┌────────────────────────────────────────┐           │
│  │ 📡 My CRM API            [Edit][Del]   │           │
│  │ Fetch customer data from CRM           │           │
│  │ Type: HTTP  │  Used by: 3 agents       │           │
│  └────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────┘
```

---

## Tool Types

| Type | Config Fields |
| ---- | ------------- |
| HTTP API | URL, Method, Headers, Body template, Auth type |
| Code Executor | Language (Python/JS/TS), Code template, Timeout |
| DB Query | Connection string, Query template, DB type |
| MCP Server | Server URL, Transport (stdio/SSE), Auth |
| Web Search | Search engine, API key, Max results |
| File Parser | Supported formats, Max file size, Parse mode |
| Email Sender | SMTP config, Template |
| Webhook | URL, Method, Payload template, Secret |

---

## SSE Chat Preview

```typescript
// Kết nối SSE tới /api/chat/stream
// EventSource hoặc fetch + ReadableStream
// Events:
//   - message: { role, content, timestamp }
//   - token: { delta } (streaming từng token)
//   - done: { fullResponse, usage }
//   - error: { message, code }
```

---

## State Management Strategy

| Store | Type | Purpose |
| ----- | ---- | ------- |
| TanStack Query | Server | Agents list, Agent detail, Tools, Workflows |
| Zustand `uiStore` | Client | Sidebar state, theme, active modals |
| Zustand `agentFormStore` | Client | Draft agent form state (unsaved changes) |
| Zustand `workflowStore` | Client | React Flow nodes/edges, selected node |

---

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_APP_NAME=Agent Builder Platform
```
