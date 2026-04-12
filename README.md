# Agent Builder Platform

A full-stack platform for building, configuring, and deploying AI agents with customizable tools and workflows.

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Setup

```bash
# Install dependencies
npm install

# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Start database and services
docker-compose up -d

# Run database seeds
cd apps/api && npm run seed

# Start development servers
npm run dev
```

## Project Structure

```
.
├── apps/
│   ├── api/          # NestJS backend (port 3001)
│   └── web/          # Next.js frontend (port 3000)
├── services/         # Shared microservices
├── docs/             # Documentation
└── docker-compose.yml
```
