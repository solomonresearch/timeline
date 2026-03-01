# CLAUDE.md — Timeline App

## Project Overview

Personal timeline application for visualizing life events, achievements, career, education, residences, and financial history. React frontend with Node.js/Express backend.

## Tech Stack

- **Frontend:** React 18+, Vite, Tailwind CSS, Recharts
- **Backend:** Node.js, Express
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Package Manager:** npm

## Commands

```bash
npm install          # Install all dependencies
npm run dev          # Start both client and server in dev mode
npm run dev:client   # Start React dev server only
npm run dev:server   # Start Express server only
npm run build        # Production build
npm run lint         # Run ESLint
npm test             # Run tests
```

## Architecture

### Frontend (`client/`)
- Vite + React SPA
- Pages: Timeline view, Event detail, Add/Edit event, Financial dashboard
- Components are functional with hooks, no class components
- Tailwind CSS for styling — no CSS modules or styled-components
- Recharts for financial/wealth visualizations

### Backend (`server/`)
- Express REST API
- Routes mounted at `/api/`
- SQLite via `better-sqlite3` for local dev, PostgreSQL for production
- No ORM — raw SQL with parameterized queries

### Data Model
- **Event:** id, title, description, date_start, date_end, category, location, metadata (JSON)
- **Categories:** residence, education, work, financial, achievement, life
- **Financial entries** are events with category=financial and structured metadata (amount, currency, type)

## Code Standards

- ES modules (`import/export`), no CommonJS
- Functional components with hooks only
- Name components in PascalCase, utilities in camelCase
- API routes: `GET /api/events`, `POST /api/events`, `PUT /api/events/:id`, `DELETE /api/events/:id`
- Use parameterized SQL queries — never interpolate user input into SQL
- Keep components small — extract when a component exceeds ~150 lines
- Error responses: `{ error: string }` with appropriate HTTP status codes

## File Conventions

- React components: `ComponentName.jsx` in `client/src/components/`
- Pages: `PageName.jsx` in `client/src/pages/`
- API routes: `resource.js` in `server/routes/`
- Database migrations: numbered SQL files in `server/db/migrations/`

## Git

- Branch from `master`
- Commit messages: `type: description` (feat, fix, docs, refactor, test, chore)
- Keep commits focused — one logical change per commit
