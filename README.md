# 🌿 Fina — Personal Finance Tracker

Fina is a full-stack personal finance tracker built with a NestJS backend and React frontend. Track expenses and income, set budget limits, manage savings goals, visualize spending trends, and import bank statements via CSV.

---

## Features

- **Dashboard** — Monthly overview with income, expenses, net savings, MoM trends, budget pace projection, and AI-driven spotlight insights
- **Transactions** — Log expenses and income with categories, search/filter, date range, and multi-currency support with live exchange rates
- **Recurring Transactions** — Mark any transaction as monthly recurring; Fina auto-generates entries on each login (up to 3 months catchup)
- **Budget Tracking** — Set per-category monthly spending limits with progress bars and over-budget warnings
- **Savings Goals** — Create goals with deadlines, log contributions, and track on-track vs at-risk status
- **Visualizations** — Pie charts by category, stacked bar charts, and a 6-month trend line
- **Monthly History** — Rolling summary table and chart with savings streak tracker; click any row to drill into that month's budget
- **CSV Import** — Auto-detects column mapping from bank exports; handles common date/amount formats; up to 500 rows per import
- **Multi-currency** — Transactions stored in their original currency with exchange rates; all totals displayed in your chosen base currency
- **Authentication** — Email/password with email verification, password reset, and Google OAuth

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Ant Design, Recharts, @ant-design/plots |
| Backend | NestJS 11, TypeORM, PostgreSQL |
| Auth | JWT, Passport.js, Google OAuth 2.0 |
| Email | Resend |
| Exchange Rates | exchangerate-api.com (1-hour cache) |

---

## Project Structure

```
├── backend/
│   └── src/
│       ├── auth/           # JWT + Google OAuth, email verification, password reset
│       ├── budget/         # Monthly category budget limits
│       ├── dashboard/      # Aggregated summaries and category breakdowns
│       ├── email/          # Transactional emails via Resend
│       ├── expenses/       # Expense CRUD
│       ├── import/         # CSV bulk import
│       ├── income/         # Income CRUD
│       ├── ledger/         # Combined filterable transaction log
│       ├── recurring/      # Recurring transaction auto-generation
│       └── savings/        # Savings goals + contributions
└── frontend/
    └── src/
        ├── components/     # Dashboard, Transactions, Budget, Savings, Visualization, etc.
        ├── pages/          # Landing, Login, Register, ForgotPassword, ResetPassword, VerifyEmail
        └── services/       # API client (axios) + exchange rate service
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/fina
JWT_SECRET=your-secret-key
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
NODE_ENV=development
PORT=3001
```

```bash
npm run start:dev
```

The backend runs on `http://localhost:3001`. TypeORM will auto-sync the schema in development.

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3001
```

```bash
npm run dev
```

The frontend runs on `http://localhost:5173`.

---

## API Overview

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/verify-email`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/google` |
| Expenses | `GET/POST /expenses`, `GET/PATCH/DELETE /expenses/:id` |
| Income | `GET/POST /income`, `GET/PATCH/DELETE /income/:id` |
| Ledger | `GET /ledger` (filterable: month, year, kind, type, search, amount range, sort) |
| Dashboard | `GET /dashboard/summary`, `/monthly-summary`, `/monthly-history`, `/expenses-by-category`, `/income-by-category` |
| Budget | `GET /budgets`, `POST /budgets/upsert`, `DELETE /budgets/:id` |
| Savings | `GET/POST /savings`, `PATCH/DELETE /savings/:id`, `POST /savings/:id/contribute`, `GET /savings/:id/contributions` |
| Recurring | `GET /recurring/summary` |
| Import | `POST /import/csv` |

All endpoints except auth routes require a `Bearer` JWT token.

---

## CSV Import Format

Fina accepts any CSV with headers. Column mapping is auto-detected but can be manually adjusted. Supported fields:

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | Transaction name / merchant |
| `amount` | Yes | Handles `$1,234.56`, `(500)`, `-200` |
| `date` | Yes | ISO, MM/DD/YYYY, DD/MM/YYYY |
| `type` | No | Category; defaults to `Other` |
| `description` | No | Optional notes |

Maximum 500 rows per import.

---

## Environment Variables Reference

### Backend

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `RESEND_API_KEY` | API key for Resend email service |
| `EMAIL_FROM` | Sender address for transactional emails |
| `FRONTEND_URL` | Used in email links and Google OAuth redirect |
| `GOOGLE_CLIENT_ID` | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth app client secret |
| `GOOGLE_CALLBACK_URL` | Must match the URI registered in Google Cloud Console |
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (default: `8080`) |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL |

---

## Deployment Notes

- The backend listens on `process.env.PORT` (default `8080`) — suitable for Railway, Render, Fly.io, etc.
- Set `NODE_ENV=production` to disable TypeORM auto-sync and enable SSL for the database connection.
- The frontend includes a `vercel.json` that rewrites all routes to `index.html` for client-side routing.
- Ensure `FRONTEND_URL` on the backend matches your deployed frontend domain so OAuth redirects and email links work correctly.

---

## License

MIT
