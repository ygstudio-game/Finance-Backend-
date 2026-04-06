# Zorvyn — Finance Data Processing & Access Control Backend

🚀 **Live API Documentation (Swagger)**: [https://finance-backend-abc.onrender.com/api-docs](https://finance-backend-abc.onrender.com/api-docs) *(Replace with actual live Render URL after deployment)*

A production-grade backend system for managing financial records, role-based access control, and summary-level analytics. Built with a **Domain-Driven Modular Monolith** architecture using a strict 3-Tier Layered pattern.

---

## Tech Stack

| Layer       | Technology        |
|-------------|-------------------|
| Runtime     | Node.js (v18+)    |
| Language    | TypeScript (strict mode) |
| Framework   | Express.js v5     |
| Database    | PostgreSQL        |
| ORM         | Prisma v6         |
| Validation  | Zod v4            |
| Security    | Helmet, CORS      |
| Dev Tools   | tsx, Morgan        |

---

## Architecture

This project follows a **Domain-Driven Layered Architecture** where code is organized by business domain, not by technical file type.

```
src/
├── config/                 # Database connection (Prisma singleton)
├── middlewares/             # Cross-cutting concerns
│   ├── auth.middleware.ts   # Mock auth + RBAC enforcement
│   ├── validate.middleware.ts # Zod schema validation
│   └── error.middleware.ts  # Global error handler
├── modules/                 # Business domains
│   ├── users/               # User management domain
│   │   ├── user.routes.ts
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── user.validation.ts
│   ├── records/             # Financial records domain
│   │   ├── record.routes.ts
│   │   ├── record.controller.ts
│   │   ├── record.service.ts
│   │   └── record.validation.ts
│   └── analytics/           # Dashboard analytics domain
│       ├── analytics.routes.ts
│       ├── analytics.controller.ts
│       └── analytics.service.ts
├── app.ts                   # Express app initialization
└── server.ts                # Server entry point
```

### Request Lifecycle

```
HTTP Request → Route → Auth Middleware → Role Check → Zod Validation → Controller → Service → Prisma → PostgreSQL
```

Every layer has a single responsibility:
- **Routes**: Define endpoints and attach middleware guards
- **Controllers**: Extract HTTP data, delegate to services, format responses
- **Services**: Encapsulate business logic and database queries
- **Middlewares**: Handle cross-cutting concerns (auth, validation, errors)

---

## Getting Started

### Prerequisites
- Node.js v18+
- pnpm (or npm/yarn)
- PostgreSQL database running locally or remotely

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd zorvyn

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL

# 4. Generate Prisma client
pnpm db:generate

# 5. Sync schema to database
pnpm db:push

# 6. Start the dev server
pnpm dev
```

The server will start at `http://localhost:5000`.
To view Swagger API Documentation locally, visit: `http://localhost:5000/api-docs`.

---

## Mock Authentication Workflow

Since this is a backend assessment, authentication uses **mock headers** instead of JWT tokens. This allows testing all RBAC flows without requiring a full auth provider.

### How it works:
1. **Create an ADMIN user first** (see seed instructions below or use the bootstrap flow)
2. **Pass the user's UUID** in the `x-user-id` header on every request
3. The auth middleware looks up the user in the database, verifies they are active, and attaches their role to the request

```bash
# Push schema and seed initial users
npx prisma db push
npx prisma db seed
```

### 3. Start Development Server
```bash
# Option 1: Use Prisma Studio
npx prisma studio
# Then manually create a user with role: ADMIN

# Option 2: Direct SQL
psql -d finance_db -c "INSERT INTO \"User\" (id, email, name, role, \"isActive\", \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), 'admin@zorvyn.com', 'Admin User', 'ADMIN', true, now(), now());"
```

---

## Role-Based Access Control (RBAC)

| Action | VIEWER | ANALYST | ADMIN |
|--------|--------|---------|-------|
| View users | ✅ | ✅ | ✅ |
| Create users | ❌ | ❌ | ✅ |
| Toggle user status | ❌ | ❌ | ✅ |
| Assign roles | ❌ | ❌ | ✅ |
| View records | ❌ | ✅ | ✅ |
| Create records | ❌ | ❌ | ✅ |
| Update records | ❌ | ❌ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| View analytics | ❌ | ✅ | ✅ |

---

## API Reference

### Health Check
```
GET /api/health
```
Returns server status. No authentication required.

---

### Users

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/users` | ADMIN | Create a new user |
| `GET` | `/api/users` | Any | List all users |
| `GET` | `/api/users/:id` | Any | Get user by ID |
| `PATCH` | `/api/users/:id/status` | ADMIN | Toggle active/inactive |
| `PATCH` | `/api/users/:id/role` | ADMIN | Assign role |

#### Create User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "x-user-id: <admin-uuid>" \
  -d '{"email": "analyst@zorvyn.com", "name": "Jane Analyst", "role": "ANALYST"}'
```

#### Update Role
```bash
curl -X PATCH http://localhost:5000/api/users/<user-uuid>/role \
  -H "Content-Type: application/json" \
  -H "x-user-id: <admin-uuid>" \
  -d '{"role": "ADMIN"}'
```

---

### Financial Records

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/records` | ADMIN | Create a record |
| `GET` | `/api/records` | ADMIN, ANALYST | List with filters & pagination |
| `GET` | `/api/records/:id` | ADMIN, ANALYST | Get single record |
| `PUT` | `/api/records/:id` | ADMIN | Update a record |
| `DELETE` | `/api/records/:id` | ADMIN | Soft-delete a record |

#### Create Record
```bash
curl -X POST http://localhost:5000/api/records \
  -H "Content-Type: application/json" \
  -H "x-user-id: <admin-uuid>" \
  -d '{"amount": 5000, "type": "INCOME", "category": "Salary", "date": "2026-04-01T00:00:00.000Z", "notes": "April salary"}'
```

#### List with Filters & Pagination
```bash
# Filter by type and paginate
curl "http://localhost:5000/api/records?type=INCOME&page=1&limit=10" \
  -H "x-user-id: <admin-uuid>"

# Filter by date range
curl "http://localhost:5000/api/records?startDate=2026-01-01T00:00:00Z&endDate=2026-12-31T23:59:59Z" \
  -H "x-user-id: <admin-uuid>"

# Filter by category
curl "http://localhost:5000/api/records?category=Salary" \
  -H "x-user-id: <admin-uuid>"
```

---

### Analytics (Dashboard)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/analytics/summary` | ADMIN, ANALYST | Dashboard overview |
| `GET` | `/api/analytics/breakdown` | ADMIN, ANALYST | Category-wise totals |
| `GET` | `/api/analytics/trends` | ADMIN, ANALYST | Monthly trends (12 months) |

#### Summary Response Shape
```json
{
  "success": true,
  "data": {
    "totalIncome": 15000,
    "totalExpenses": 8500,
    "netBalance": 6500,
    "totalRecords": 12,
    "incomeCount": 5,
    "expenseCount": 7,
    "recentActivity": [...]
  }
}
```

#### Trends Response Shape
```json
{
  "success": true,
  "data": [
    { "month": "2026-01", "income": 5000, "expense": 2000, "net": 3000 },
    { "month": "2026-02", "income": 6000, "expense": 3500, "net": 2500 }
  ]
}
```

---

## Validation & Error Handling

All input is validated using **Zod schemas** before reaching the controller. Errors follow a consistent JSON format:

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    { "path": "body.amount", "message": "Amount must be positive" },
    { "path": "body.type", "message": "Type must be INCOME or EXPENSE" }
  ]
}
```

### Authentication Error (401)
```json
{ "success": false, "error": "Authentication required" }
```

### Authorization Error (403)
```json
{ "success": false, "error": "Access denied: insufficient permissions" }
```

### Not Found Error (404)
```json
{ "success": false, "error": "User not found" }
```

### Duplicate Error (409)
```json
{ "success": false, "error": "A user with this email already exists" }
```

---

## Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      Role     @default(VIEWER)
  isActive  Boolean  @default(true)
  records   Record[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Record {
  id        String     @id @default(uuid())
  amount    Float
  type      RecordType
  category  String
  date      DateTime
  notes     String?
  userId    String
  user      User       @relation(fields: [userId], references: [id])
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  deletedAt DateTime?  // Soft delete marker
}

enum Role { VIEWER, ANALYST, ADMIN }
enum RecordType { INCOME, EXPENSE }
```

### Design Decisions
- **UUIDs** for primary keys instead of auto-increment (prevents enumeration attacks)
- **Soft deletes** via `deletedAt` field (preserves audit trail, records are excluded from queries automatically)
- **Enum types** for Role and RecordType (enforced at DB level)
- **Timestamps** (`createdAt`, `updatedAt`) auto-managed by Prisma

---

## Optional Enhancements Included

| Enhancement | Status | Details |
|-------------|--------|---------|
| Pagination | ✅ | Page/limit params with total count metadata |
| Soft deletes | ✅ | Records are never physically removed |
| Search/filtering | ✅ | By type, category, date range |
| Input validation | ✅ | Zod schemas with descriptive error messages |
| Health check | ✅ | `GET /api/health` |
| Error codes | ✅ | Prisma error codes mapped to HTTP status codes |
| Security headers | ✅ | Helmet middleware |
| Graceful shutdown | ✅ | SIGINT/SIGTERM handlers |

---

## Assumptions & Tradeoffs

1. **Mock Auth over JWT**: Using header-based mock authentication to focus on RBAC logic rather than token management. In production, this would be replaced with JWT or OAuth2.
2. **Prisma v6 over v7**: Prisma v7 introduced breaking changes to the datasource configuration. v6 was chosen for stability and simplicity.
3. **Application-layer date grouping for trends**: Monthly trends use application-layer grouping instead of raw SQL `date_trunc` for ORM portability.
4. **No unit tests included**: The focus is on architectural clarity and functional completeness. Tests could be added with Jest/Vitest.
5. **Single database for all domains**: As a modular monolith, all domains share the same PostgreSQL instance. This is appropriate for the scale of this project.

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `pnpm dev` | Start with hot-reload (tsx watch) |
| Build | `pnpm build` | Compile TypeScript to JavaScript |
| Start | `pnpm start` | Run compiled production build |
| DB Generate | `pnpm db:generate` | Generate Prisma client |
| DB Push | `pnpm db:push` | Sync schema to database |

---

---

## 🧠 Challenges & Solutions

### 1. ESM Module Resolution
**Challenge**: Node.js ESM requirements conflicted with `ts-node-dev` and Prisma extensions.
**Solution**: Migrated to `tsx` for high-performance development execution and strictly enforced `.js` extensions in imports as per ESM standards.

### 2. Bootstrapping a Secure System
**Challenge**: Every route requires authorization, but a new DB has no users.
**Solution**: Implemented a comprehensive `prisma/seed.ts` script that initializes the system with hierarchical roles (Admin, Analyst, Viewer).

### 3. Production Readiness on Render
**Challenge**: Ensuring database connectivity and build steps worked seamlessly in a CI/CD environment.
**Solution**: Optimized `package.json` scripts (`build`, `start`, `db:push`) to handle TypeScript compilation and Prisma generation automatically during deployment.

---

## License

ISC
