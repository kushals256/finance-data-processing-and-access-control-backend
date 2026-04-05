# Finance Data Processing & Access Control Backend

> A production-grade Node.js + Express + MongoDB backend for a finance dashboard with RBAC, audit trails, anomaly detection, idempotency-safe transactions, and aggregation-powered analytics.

## ✨ Key Features

### Core Requirements
- **User & Role Management** — Create/manage users with role-based access (Viewer, Analyst, Admin)
- **Financial Records CRUD** — Full create, read, update, soft-delete with filtering, sorting, pagination
- **Dashboard Analytics** — MongoDB aggregation pipelines for summaries, trends, and category breakdowns
- **RBAC Access Control** — 13-permission matrix enforced via middleware
- **Joi Validation** — Strict input validation on all endpoints with structured error responses
- **Swagger API Docs** — Full OpenAPI 3.0 interactive documentation

### Standout Differentiators
| Feature | What It Does | Why It Matters |
|---------|-------------|----------------|
| 🔍 **Immutable Audit Trail** | Logs every mutation with before/after snapshots | Compliance & debugging in financial systems |
| 🔑 **Idempotency Keys** | Prevents duplicate transactions on network retries | Financial transaction safety |
| ⚠️ **Anomaly Detection** | Flags suspicious transactions via rule engine | Proactive risk detection |
| 📥 **Bulk CSV Import** | Two-step validate → confirm import flow | Practical data ingestion |
| 📤 **Data Export** | Export filtered records as CSV/JSON | Reporting & external integrations |
| 🔗 **Correlation IDs** | Unique ID per request across all log lines | Production observability |

### Optional Enhancements (All Included)
- ✅ JWT Authentication (register/login)
- ✅ Pagination with full metadata
- ✅ Text search across descriptions and notes
- ✅ Soft delete with `isDeleted` flag
- ✅ Rate limiting (general + auth-specific)
- ✅ Integration tests (Jest + Supertest)
- ✅ Swagger API documentation
- ✅ Security headers (Helmet)
- ✅ Structured logging (Winston)
- ✅ Graceful shutdown

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v18+ |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Joi |
| RBAC | Custom middleware |
| API Docs | swagger-jsdoc + swagger-ui-express |
| Logging | Winston + AsyncLocalStorage |
| Testing | Jest + Supertest + mongodb-memory-server |
| CSV | csv-parser + json2csv |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB running locally (or provide Atlas URI)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 3. Seed the database with sample data
npm run seed

# 4. Start the development server
npm run dev
```

The server starts at `http://localhost:5000`

### Quick Links
- **API Docs**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

### Seed Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@finance.com | Admin@123 |
| Analyst | analyst@finance.com | Analyst@123 |
| Viewer | viewer@finance.com | Viewer@123 |

---

## 📐 Architecture

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│  Middleware  │────▶│  Controller  │────▶│   Service    │
│  (API Call)  │     │  Pipeline    │     │  (Routing)   │     │  (Business   │
└──────────────┘     └─────────────┘     └──────────────┘     │   Logic)     │
                           │                                    └──────┬───────┘
                     ┌─────┴──────┐                                    │
                     │ correlation│                              ┌─────┴───────┐
                     │ helmet     │                              │  MongoDB    │
                     │ rateLimit  │                              │  (Mongoose) │
                     │ auth (JWT) │                              └─────────────┘
                     │ rbac       │
                     │ validate   │
                     │ idempotency│
                     └────────────┘
```

### Request Lifecycle
1. **Correlation ID** → Assigned to request, propagated to all logs
2. **Security** → Helmet headers, CORS, rate limiting
3. **Authentication** → JWT verify, user hydration, active status check
4. **Authorization** → Role checked against permission matrix
5. **Idempotency** → Check for duplicate key (POST/PATCH)
6. **Validation** → Joi schema validation on body/query/params
7. **Controller** → Route to appropriate handler
8. **Service** → Business logic, anomaly detection, audit logging
9. **Response** → Standardized `ApiResponse` format

---

## 🔐 RBAC Permission Matrix

| Permission | Viewer | Analyst | Admin |
|------------|:------:|:-------:|:-----:|
| View records | ✅ | ✅ | ✅ |
| View dashboard summary | ✅ | ✅ | ✅ |
| View recent activity | ✅ | ✅ | ✅ |
| View analytics/insights | ❌ | ✅ | ✅ |
| View category breakdown | ❌ | ✅ | ✅ |
| View trends | ❌ | ✅ | ✅ |
| Export data | ❌ | ✅ | ✅ |
| Create records | ❌ | ❌ | ✅ |
| Update records | ❌ | ❌ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| Import records (CSV) | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/auth/register` | Public | Register user |
| POST | `/api/v1/auth/login` | Public | Login, get JWT |
| GET | `/api/v1/auth/me` | Auth | Current profile |

### Users (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List users (paginated) |
| GET | `/api/v1/users/:id` | Get user by ID |
| PATCH | `/api/v1/users/:id` | Update role/status |
| DELETE | `/api/v1/users/:id` | Delete user |

### Financial Records
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/records` | Admin | Create record |
| GET | `/api/v1/records` | Viewer+ | List (paginated, filterable) |
| GET | `/api/v1/records/:id` | Viewer+ | Get by ID |
| PATCH | `/api/v1/records/:id` | Admin | Update |
| DELETE | `/api/v1/records/:id` | Admin | Soft-delete |
| POST | `/api/v1/records/import/validate` | Admin | CSV validate (step 1) |
| POST | `/api/v1/records/import/confirm` | Admin | CSV import (step 2) |

**Filter params**: `type`, `category`, `startDate`, `endDate`, `search`, `flagged`, `sortBy`, `sortOrder`, `page`, `limit`

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/dashboard/summary` | Viewer+ | Income/expense/net |
| GET | `/api/v1/dashboard/category-breakdown` | Analyst+ | By category (%) |
| GET | `/api/v1/dashboard/monthly-trends` | Analyst+ | Monthly data |
| GET | `/api/v1/dashboard/weekly-trends` | Analyst+ | Last 7 days |
| GET | `/api/v1/dashboard/recent-activity` | Viewer+ | Recent records |
| GET | `/api/v1/dashboard/anomaly-stats` | Analyst+ | Flagged stats |

### Export
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/export/records` | Analyst+ | CSV/JSON download |

### Audit Logs (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/audit-logs` | All audit logs (paginated) |
| GET | `/api/v1/dashboard/audit-logs/:entity/:entityId` | Entity audit trail |

---

## 🧩 Design Decisions & Tradeoffs

### Why Immutable Audit Logs?
In financial systems, audit trails are non-negotiable. Every mutation (create, update, delete) is logged with before/after snapshots. The audit log collection has no update or delete operations — it is append-only by design.

### Why Idempotency Keys?
Network retries can cause duplicate transactions. The `Idempotency-Key` header prevents this by caching the response for a given key. If the same key is sent again, the cached response is returned without re-processing. Keys auto-expire after 24 hours via MongoDB TTL.

### Why Anomaly Detection?
Rather than just storing data, the backend actively analyzes it. Three rules flag suspicious activity:
1. **HIGH_AMOUNT_FOR_CATEGORY** — Amount exceeds 3× the category average
2. **RAPID_TRANSACTIONS** — >5 transactions in 60 seconds by the same user
3. **EXCEEDS_THRESHOLD** — Amount exceeds $50,000 (configurable)

Flags are stored on the record and surfaced via the dashboard.

### Why Correlation IDs?
Every request gets a unique `X-Correlation-ID` that propagates through all log lines via `AsyncLocalStorage`. This enables end-to-end request tracing in production — essential for debugging distributed systems.

### Why Soft Delete?
Financial records should never be permanently deleted. Soft delete marks records as `isDeleted: true` and excludes them from normal queries while preserving them for audit and compliance purposes.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

Tests use `mongodb-memory-server` for an isolated in-memory MongoDB instance — no external database needed.

### Test Coverage
- **Auth**: Register, login, token validation, inactive user rejection
- **RBAC**: All role-permission boundaries verified
- **Records**: CRUD, pagination, filtering, sorting, soft delete
- **Dashboard**: Aggregation pipeline correctness
- **Idempotency**: Duplicate prevention verification
- **Audit Trail**: Log creation on all mutations

---

## 📝 Assumptions

1. **Single Currency** — No multi-currency support; amounts are in a single base currency
2. **System-wide Records** — All authorized users see all financial records (not user-scoped)
3. **Audit Retention** — Audit logs retained indefinitely (configurable TTL available)
4. **Anomaly Thresholds** — Configurable via environment variables
5. **CSV Import** — Max file size 5MB, only CSV format supported
6. **No Future Dates** — Financial record dates cannot be in the future
7. **Soft Delete Only** — Records are never permanently deleted; they're marked `isDeleted`

---

## 📁 Project Structure

```
├── src/
│   ├── config/          # DB, env, logger, swagger configuration
│   ├── constants/       # Role permissions, anomaly rules
│   ├── middleware/       # Auth, RBAC, validation, idempotency, error handler
│   ├── models/          # Mongoose schemas (User, Record, AuditLog, IdempotencyKey)
│   ├── routes/          # Express routes with Swagger annotations
│   ├── controllers/     # Request handling (thin layer)
│   ├── services/        # Business logic (thick layer)
│   ├── validations/     # Joi schemas
│   ├── utils/           # ApiError, ApiResponse, pagination, catchAsync
│   └── app.js           # Express app assembly
├── tests/               # Jest integration tests
├── scripts/seed.js      # Database seeder
├── sample/              # Sample CSV for import testing
├── server.js            # Entry point with graceful shutdown
└── README.md
```

---

## 📄 License

ISC
