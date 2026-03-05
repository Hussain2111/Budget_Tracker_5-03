

# Budget Tracker

A full-stack budget management application with a **NestJS + TypeORM** backend and a **React (Vite) + Ant Design** frontend.

## Quick Start (recommended)

From the repo root:
```
bash
npm install
npm run dev
```
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

> The root `dev` script runs both apps concurrently.

---

## Project Structure
```
text
budgettracker-app/
├── backend/              # NestJS backend API
└── frontend/             # React Vite frontend
```
---

## Setup

### Prerequisites
- Node.js + npm
- PostgreSQL

### Backend Setup
```
bash
cd backend
npm install
```
Create `backend/.env`:
```
env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=<DB_USERNAME>
DB_PASSWORD=<DB_PASSWORD>
DB_NAME=<DB_NAME>

PORT=3000
NODE_ENV=development
```
Start backend:
```
bash
npm run start:dev
```
### Frontend Setup
```
bash
cd frontend
npm install
npm run dev
```
Frontend will be available at:

- `http://localhost:5173`

---

## Running both apps from the root
```
bash
npm install
npm run dev
```
This runs:
- `npm --prefix backend run start:dev`
- `npm --prefix frontend run dev`

---

## Features

### Dashboard
- Summary KPIs (balance, income, expenses, savings goals)
- Monthly summary
- Top categories for the current month
- Recent transactions table

### Transactions
- Expenses + Income tabs
- Create, read, update, delete records
- Categories, dates, optional descriptions
- Table sorting/pagination

### Other modules (UI)
- Savings
- Budget
- Visualization
- Monthly history summary

---

## API Endpoints (high level)

> Exact routes may evolve; see backend controllers for the source of truth.

### Expenses
- `GET /expenses`
- `POST /expenses`
- `PATCH /expenses/:id`
- `DELETE /expenses/:id`

### Income
- `GET /income`
- `POST /income`
- `PATCH /income/:id`
- `DELETE /income/:id`

---

## Tech Stack

**Backend**
- NestJS
- TypeORM
- PostgreSQL
- Passport/JWT (auth)

**Frontend**
- React 18
- Vite
- Ant Design
- Axios
- Day.js



