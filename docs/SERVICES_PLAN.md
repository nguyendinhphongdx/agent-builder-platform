# Services Infrastructure Plan (`services/`)

## Overview

Mỗi service có docker-compose riêng để có thể start/stop độc lập. Root docker-compose orchestrate tất cả.

---

## Folder Structure

```
services/
├── postgres/
│   ├── docker-compose.yml
│   ├── init/
│   │   └── 01-init.sql          # Create database & extensions
│   └── .env
│
├── redis/
│   ├── docker-compose.yml
│   ├── redis.conf               # Custom Redis config
│   └── .env
│
├── rabbitmq/
│   ├── docker-compose.yml
│   ├── rabbitmq.conf
│   ├── definitions.json         # Pre-configured queues & exchanges
│   └── .env
│
└── ai-service/
    ├── docker-compose.yml
    ├── litellm-config.yaml      # LiteLLM model config
    ├── Dockerfile               # Custom LiteLLM image (if needed)
    └── .env
```

---

## 1. PostgreSQL (`services/postgres`)

### docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: agentbuilder-postgres
    restart: unless-stopped
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-agentbuilder}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-agentbuilder_secret}
      POSTGRES_DB: ${POSTGRES_DB:-agentbuilder}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-agentbuilder}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - agentbuilder-network

volumes:
  postgres_data:

networks:
  agentbuilder-network:
    external: true
```

### init/01-init.sql
```sql
-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- Trigram for fuzzy search
-- vector extension for knowledge embeddings (if using pgvector)
-- CREATE EXTENSION IF NOT EXISTS "vector";
```

---

## 2. Redis (`services/redis`)

### docker-compose.yml
```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    container_name: agentbuilder-redis
    restart: unless-stopped
    ports:
      - "${REDIS_PORT:-6379}:6379"
    command: redis-server /usr/local/etc/redis/redis.conf
    volumes:
      - redis_data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - agentbuilder-network

volumes:
  redis_data:

networks:
  agentbuilder-network:
    external: true
```

### Purpose
- **Session cache**: Cache JWT sessions & user data
- **Rate limiting**: API rate limiting per user
- **Chat context**: Cache recent chat messages for fast retrieval
- **Pub/Sub**: Real-time events between services
- **Queue results**: Cache tool execution results

---

## 3. RabbitMQ (`services/rabbitmq`)

### docker-compose.yml
```yaml
version: '3.8'
services:
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: agentbuilder-rabbitmq
    restart: unless-stopped
    ports:
      - "${RABBITMQ_PORT:-5672}:5672"
      - "${RABBITMQ_MGMT_PORT:-15672}:15672"
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-agentbuilder}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASS:-agentbuilder_secret}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
      - ./definitions.json:/etc/rabbitmq/definitions.json
      - ./rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_running"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - agentbuilder-network

volumes:
  rabbitmq_data:

networks:
  agentbuilder-network:
    external: true
```

### Queues & Exchanges
```json
{
  "queues": [
    { "name": "knowledge.process", "durable": true },
    { "name": "workflow.execute", "durable": true },
    { "name": "tool.execute", "durable": true },
    { "name": "notification.send", "durable": true }
  ],
  "exchanges": [
    { "name": "agentbuilder.events", "type": "topic", "durable": true }
  ],
  "bindings": [
    { "source": "agentbuilder.events", "destination": "knowledge.process", "routing_key": "knowledge.*" },
    { "source": "agentbuilder.events", "destination": "workflow.execute", "routing_key": "workflow.*" },
    { "source": "agentbuilder.events", "destination": "tool.execute", "routing_key": "tool.*" },
    { "source": "agentbuilder.events", "destination": "notification.send", "routing_key": "notification.*" }
  ]
}
```

### Use Cases
- **knowledge.process**: Async file processing (PDF parsing, chunking, embedding)
- **workflow.execute**: Async workflow execution (long-running workflows)
- **tool.execute**: Async tool execution (timeout-prone tools)
- **notification.send**: User notifications (workflow complete, share invites)

---

## 4. AI Service - LiteLLM (`services/ai-service`)

### docker-compose.yml
```yaml
version: '3.8'
services:
  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    container_name: agentbuilder-litellm
    restart: unless-stopped
    ports:
      - "${LITELLM_PORT:-4000}:4000"
    environment:
      LITELLM_MASTER_KEY: ${LITELLM_MASTER_KEY:-sk-litellm-master-key}
      DATABASE_URL: postgresql://${POSTGRES_USER:-agentbuilder}:${POSTGRES_PASSWORD:-agentbuilder_secret}@postgres:5432/${POSTGRES_DB:-agentbuilder}
    volumes:
      - ./litellm-config.yaml:/app/config.yaml
    command: ["--config", "/app/config.yaml", "--port", "4000"]
    depends_on:
      - postgres
    networks:
      - agentbuilder-network

networks:
  agentbuilder-network:
    external: true
```

### litellm-config.yaml
```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

  - model_name: gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY

  - model_name: claude-sonnet-4-20250514
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: claude-haiku
    litellm_params:
      model: anthropic/claude-haiku-4-5-20251001
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gemini-pro
    litellm_params:
      model: gemini/gemini-2.0-flash
      api_key: os.environ/GOOGLE_API_KEY

litellm_settings:
  drop_params: true
  set_verbose: false
  cache: true
  cache_params:
    type: redis
    host: redis
    port: 6379

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL
```

### Purpose
- **Unified LLM API**: Single endpoint cho tất cả LLM providers
- **Model routing**: Route requests tới models khác nhau
- **Cost tracking**: Track usage & cost per user/agent
- **Rate limiting**: Per-model rate limits
- **Fallbacks**: Auto-fallback khi primary model fails
- **Caching**: Cache LLM responses via Redis

---

## 5. Root Docker Compose

```
root/docker-compose.yml
```

```yaml
version: '3.8'

# Root compose to start all services together
# Individual services can also be started separately

services:
  postgres:
    extends:
      file: ./services/postgres/docker-compose.yml
      service: postgres

  redis:
    extends:
      file: ./services/redis/docker-compose.yml
      service: redis

  rabbitmq:
    extends:
      file: ./services/rabbitmq/docker-compose.yml
      service: rabbitmq

  litellm:
    extends:
      file: ./services/ai-service/docker-compose.yml
      service: litellm
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

networks:
  agentbuilder-network:
    driver: bridge
```

---

## Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                 agentbuilder-network                     │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │PostgreSQL│  │  Redis   │  │ RabbitMQ │  │ LiteLLM │ │
│  │  :5432   │  │  :6379   │  │  :5672   │  │  :4000  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │              │             │              │      │
└───────┼──────────────┼─────────────┼──────────────┼──────┘
        │              │             │              │
   ┌────┴──────────────┴─────────────┴──────────────┴────┐
   │                  NestJS API (apps/api)                │
   │                     :3001                             │
   └──────────────────────┬───────────────────────────────┘
                          │
   ┌──────────────────────┴───────────────────────────────┐
   │                Next.js Frontend (apps/web)            │
   │                     :3000                             │
   └──────────────────────────────────────────────────────┘
```

---

## Environment Variables Summary

```env
# PostgreSQL
POSTGRES_USER=agentbuilder
POSTGRES_PASSWORD=agentbuilder_secret
POSTGRES_DB=agentbuilder
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_USER=agentbuilder
RABBITMQ_PASS=agentbuilder_secret
RABBITMQ_PORT=5672
RABBITMQ_MGMT_PORT=15672

# LiteLLM
LITELLM_PORT=4000
LITELLM_MASTER_KEY=sk-litellm-master-key

# LLM API Keys
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_API_KEY=xxx

# JWT
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```
