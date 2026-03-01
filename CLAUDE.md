# CLAUDE.md — Life Timeline App

## Project Overview

Personal life timeline visualization — horizontal swim-lane view of life events across dimensions (location, work, education, relations, etc.). React SPA backed by Supabase for auth, data persistence, and real-time sync. Supports multiple timelines per user, historical persona overlays (age-aligned), and a kanban board for planning.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 7, Tailwind CSS v4
- **UI Components:** shadcn/ui (Radix primitives + CVA + Tailwind)
- **Icons:** Lucide React
- **Drag & Drop:** @dnd-kit (core + sortable)
- **Backend:** Supabase (PostgreSQL, Auth, Row-Level Security)
- **Package Manager:** npm

## Commands

```bash
npm install          # Install all dependencies
npm run dev          # Start Vite dev server (localhost:4000)
npm run build        # Production build (tsc + vite build)
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Environment Variables

```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

## Architecture

### File Structure (`src/`)
```
src/
├── App.tsx                        # Root component — routing, auth gating, layout
├── main.tsx                       # Entry point
├── index.css                      # Tailwind imports + theme variables
├── types/
│   ├── timeline.ts                # Lane, TimelineEvent type definitions
│   └── database.ts                # Supabase row types (DbProfile, DbTimeline, DbLane, DbEvent, DbPersona, etc.)
├── data/
│   └── seedData.ts                # Default lanes (10) + sample events (offline fallback)
├── hooks/
│   ├── useTimeline.ts             # Legacy client-only state hook
│   ├── useSupabaseTimeline.ts     # Supabase-backed timeline state (lanes, events CRUD)
│   ├── useTimelines.ts            # Multi-timeline management (list, create, rename, delete)
│   ├── useProfile.ts              # Current user profile state + update
│   └── usePersonas.ts             # Persona overlay data + age-alignment
├── lib/
│   ├── utils.ts                   # cn() utility for Tailwind class merging
│   ├── constants.ts               # Layout, zoom, year-range constants + helpers
│   ├── supabase.ts                # Supabase client init
│   └── api.ts                     # All Supabase CRUD functions (profiles, timelines, lanes, events, personas, kanban)
├── contexts/
│   ├── AuthContext.tsx             # Auth state provider (sign up/in/out, password reset, pending profile application)
│   └── TimelineContext.tsx         # Active timeline + data provider
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   │   ├── alert-dialog.tsx
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx
│   │   ├── select.tsx
│   │   ├── switch.tsx
│   │   ├── textarea.tsx
│   │   └── tooltip.tsx
│   ├── timeline/
│   │   ├── TimelineContainer.tsx   # Main layout: sidebar + scrollable area
│   │   ├── TimelineHeader.tsx      # Sticky year labels + tick marks
│   │   ├── TimelineLane.tsx        # Single swim lane with events
│   │   ├── TimelineEvent.tsx       # Rendered event (bar for range, dot for point)
│   │   ├── LaneSidebar.tsx         # Lane labels, visibility toggle, dropdown menu
│   │   ├── YearGrid.tsx            # Vertical dashed year lines
│   │   └── PersonaEventBar.tsx     # Persona overlay event rendering
│   ├── kanban/
│   │   ├── KanbanBoard.tsx         # Kanban board with drag-and-drop columns
│   │   ├── KanbanColumn.tsx        # Single kanban column (todo/in_progress/done)
│   │   └── KanbanCard.tsx          # Draggable kanban card
│   ├── auth/
│   │   ├── AuthPage.tsx            # Auth page shell
│   │   ├── SignInForm.tsx          # Email/password sign-in
│   │   ├── SignUpForm.tsx          # Sign-up with birth year (required), birth date (optional), bio (required)
│   │   ├── ForgotPasswordForm.tsx  # Password reset request
│   │   ├── UpdatePasswordForm.tsx  # Set new password after recovery
│   │   └── CheckEmailMessage.tsx   # Post-signup email verification prompt
│   ├── dialogs/
│   │   ├── EventDialog.tsx         # Add/Edit event form
│   │   ├── LaneDialog.tsx          # Add/Edit lane form
│   │   └── DeleteConfirmDialog.tsx # Confirmation before delete
│   ├── EventPopover.tsx            # Click-on-event detail popover
│   ├── Toolbar.tsx                 # Top bar: title, zoom slider, add buttons
│   ├── TimelineSelector.tsx        # Timeline switcher dropdown
│   ├── PersonaToggle.tsx           # Enable/disable persona overlays
│   ├── ProfileDialog.tsx           # Edit profile (display name, birth year, birth date, bio)
│   └── UserMenu.tsx                # User avatar/menu dropdown
```

### Database Schema (Supabase PostgreSQL)

**profiles**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | FK → auth.users(id) |
| display_name | text | Default `''` |
| bio | text | Default `''` |
| birth_date | date | Nullable |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

**timelines**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| user_id | uuid | FK → auth.users(id) |
| name | text | Default `'My Life'` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

**lanes**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| timeline_id | uuid | FK → timelines(id) |
| name | text | |
| color | text | Default `'#3b82f6'` |
| visible | boolean | Default `true` |
| is_default | boolean | Default `false` |
| order | integer | Default `0` |

**events**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| lane_id | uuid | FK → lanes(id) |
| timeline_id | uuid | FK → timelines(id) |
| title | text | |
| description | text | Default `''` |
| type | text | `'range'` or `'point'` |
| start_year | real | |
| end_year | real | Nullable |
| color | text | Nullable |

**personas**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| name | text | |
| bio | text | Default `''` |
| birth_year | integer | |
| death_year | integer | Nullable |

**persona_events**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| persona_id | uuid | FK → personas(id) |
| lane_name | text | Matched by name to user lanes |
| title | text | |
| description | text | Default `''` |
| type | text | `'range'` or `'point'` |
| start_year | real | |
| end_year | real | Nullable |
| color | text | Nullable |

**kanban_cards**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| title | text | |
| description | text | Nullable |
| status | text | `'todo'`, `'in_progress'`, or `'done'` |
| position | integer | Default `0` |
| created_by | uuid | FK → auth.users(id), nullable |
| archived | boolean | Default `false` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

### Frontend Data Model (TypeScript)
- **Lane:** id, name, color, visible, isDefault, order
- **TimelineEvent:** id, laneId, title, description, type (`range`|`point`), startYear (float), endYear?, color?
- **DbProfile:** id, display_name, bio, birth_year, birth_date, created_at, updated_at
- **Default lanes:** Location, University, Work, Other Activities, Type of House, Wealth, Relations, Kids, Parents, Cars

### Key Patterns
- `pixelsPerYear` controls zoom (0.5–200px, default 80)
- Position formula: `left = (year - yearStart) * pixelsPerYear`
- Year range: 0–2500 (configurable via constants)
- Range events → colored rounded bars; point events → colored dots
- Lane sidebar is `sticky left-0` — scrolls vertically with lanes but not horizontally
- Present-day line rendered at current year fraction
- Past events are dimmed relative to current date
- Persona events are age-aligned to the user's birth year
- Signup stores pending profile data in localStorage; applied on first sign-in after email verification
- Kanban board uses @dnd-kit for drag-and-drop between columns

### Supabase Migrations
```
supabase/migrations/
├── 001_schema.sql              # Core tables: profiles, timelines, lanes, events + RLS + triggers
├── 002_seed_personas.sql       # Historical persona seed data
├── 003_profile_birth_year.sql  # Added birth_year column to profiles
├── 004_kanban_cards.sql        # Kanban cards table
└── 005_profile_birth_date.sql  # Added birth_date column to profiles
```

## Code Standards

- ES modules (`import/export`), no CommonJS
- TypeScript strict mode
- Functional components with hooks only
- PascalCase components, camelCase utilities
- Path alias: `@/` → `src/`
- Tailwind CSS for styling — no CSS modules or styled-components
- Supabase client instantiated once in `lib/supabase.ts`, used via `lib/api.ts` functions

## Git

- Branch from `master`
- Commit messages: `type: description` (feat, fix, docs, refactor, test, chore)
- Keep commits focused — one logical change per commit
