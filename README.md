# FinVista

FinVista is a full-stack personal finance planning app built with React, Vite, Express, and SQLite.

It helps users:
- Calculate loan EMI, payoff timeline, and interest savings
- Estimate insurance premiums
- Project SIP returns and long-term wealth growth
- Save financial scenarios in a local database

## Tech Stack

- Frontend: React + Vite
- Backend: Express
- Database: SQLite
- Runtime: Node.js

## App Structure

```text
src/
  components/      Shared UI building blocks
  features/        Dashboard, loan, insurance, SIP, and saved plans
  lib/             API client, calculators, and formatters
server/
  data/            SQLite database files
  db.js            Database setup and persistence helpers
  index.js         API server
```

## Local Development

```bash
npm install
npm run dev
```

This starts:
- React app on `http://localhost:5173`
- API server on `http://localhost:4000`

## Environment Variables

Copy `.env.example` to `.env` and update values for your environment.

- `JWT_SECRET`: required for secure production authentication
- `PORT`: backend API port
- `VITE_API_URL`: frontend API base URL
- `FINVISTA_DB_PATH`: SQLite database path

## API Routes

- `GET /`
- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/plans`
- `POST /api/plans`
- `DELETE /api/plans/:id`

## Deployment Notes

- Set `VITE_API_URL` if your frontend and backend are hosted on different domains.
- If they are deployed together behind one domain, the frontend can keep using `/api`.
- Persist the SQLite file in `server/data/finvista.db` or replace SQLite with Postgres/MySQL for multi-user production.
- Set a strong `JWT_SECRET` in production and do not rely on the development fallback.

## Product Name

Suggested deployment name: `FinVista`

Suggested tagline: `Smart Finance Planner for Loans, Insurance, and SIP Growth`
