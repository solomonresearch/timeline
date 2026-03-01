# Life Timeline

A personal life timeline visualization app — horizontal swim-lane view of life events across dimensions like location, work, education, relationships, and more. Built with React and backed by Supabase for authentication, persistence, and real-time sync.

## Features

- **Swim-lane timeline** — visualize life events across customizable lanes (Location, Work, Education, Relations, etc.)
- **Range & point events** — range events render as colored bars, point events as dots
- **Zoom & scroll** — smooth zoom from 0.5 to 200 pixels/year with sticky lane sidebar
- **Multiple timelines** — create, rename, and switch between separate timelines
- **Persona overlays** — compare your timeline against historical figures, age-aligned to your birth year
- **Present-day line** — vertical marker at current date with past-event dimming
- **Kanban board** — drag-and-drop task board with todo/in-progress/done columns
- **User profiles** — display name, birth year, birth date, and bio
- **Auth flow** — email/password signup with mandatory birth year and bio, optional birth date; email verification; password reset

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 7 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix primitives + CVA) |
| Icons | Lucide React |
| Drag & Drop | @dnd-kit |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| Package Manager | npm |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd timeline
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Run the database migrations in your Supabase project (SQL Editor or CLI):
   - `supabase/migrations/001_schema.sql` — core tables, RLS policies, triggers
   - `supabase/migrations/002_seed_personas.sql` — historical persona data
   - `supabase/migrations/003_profile_birth_year.sql` — birth_year column
   - `supabase/migrations/004_kanban_cards.sql` — kanban cards table
   - `supabase/migrations/005_profile_birth_date.sql` — birth_date column

5. Start the dev server:
   ```bash
   npm run dev
   ```

   The app runs at `http://localhost:4000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## Project Structure

```
src/
├── App.tsx                        # Root component — routing, auth gating, layout
├── main.tsx                       # Entry point
├── index.css                      # Tailwind imports + theme variables
├── types/
│   ├── timeline.ts                # Lane, TimelineEvent type definitions
│   └── database.ts                # Supabase row types (DbProfile, DbTimeline, DbLane, etc.)
├── data/
│   └── seedData.ts                # Default lanes + sample events (offline fallback)
├── hooks/
│   ├── useSupabaseTimeline.ts     # Supabase-backed timeline state (lanes, events CRUD)
│   ├── useTimelines.ts            # Multi-timeline management
│   ├── useProfile.ts              # User profile state + update
│   └── usePersonas.ts             # Persona overlay data + age-alignment
├── lib/
│   ├── utils.ts                   # cn() class merging utility
│   ├── constants.ts               # Layout, zoom, year-range constants
│   ├── supabase.ts                # Supabase client initialization
│   └── api.ts                     # All Supabase CRUD functions
├── contexts/
│   ├── AuthContext.tsx             # Auth state provider
│   └── TimelineContext.tsx         # Active timeline + data provider
├── components/
│   ├── ui/                        # shadcn/ui primitives (button, dialog, input, etc.)
│   ├── timeline/                  # Timeline rendering components
│   │   ├── TimelineContainer.tsx   # Main layout: sidebar + scrollable area
│   │   ├── TimelineHeader.tsx      # Year labels + tick marks
│   │   ├── TimelineLane.tsx        # Single swim lane with events
│   │   ├── TimelineEvent.tsx       # Event rendering (bar or dot)
│   │   ├── LaneSidebar.tsx         # Lane labels + visibility controls
│   │   ├── YearGrid.tsx            # Vertical year grid lines
│   │   └── PersonaEventBar.tsx     # Persona overlay events
│   ├── kanban/                    # Kanban board components
│   │   ├── KanbanBoard.tsx         # Board with drag-and-drop columns
│   │   ├── KanbanColumn.tsx        # Column (todo / in_progress / done)
│   │   └── KanbanCard.tsx          # Draggable card
│   ├── auth/                      # Authentication components
│   │   ├── AuthPage.tsx            # Auth page shell
│   │   ├── SignUpForm.tsx          # Signup (email, password, birth year, bio)
│   │   ├── SignInForm.tsx          # Sign-in form
│   │   ├── ForgotPasswordForm.tsx  # Password reset request
│   │   ├── UpdatePasswordForm.tsx  # New password form
│   │   └── CheckEmailMessage.tsx   # Email verification prompt
│   ├── dialogs/                   # Modal dialogs
│   │   ├── EventDialog.tsx         # Add/Edit event
│   │   ├── LaneDialog.tsx          # Add/Edit lane
│   │   └── DeleteConfirmDialog.tsx # Delete confirmation
│   ├── EventPopover.tsx            # Event detail popover
│   ├── Toolbar.tsx                 # Top bar with zoom, add buttons
│   ├── TimelineSelector.tsx        # Timeline switcher
│   ├── PersonaToggle.tsx           # Persona overlay toggle
│   ├── ProfileDialog.tsx           # Edit profile dialog
│   └── UserMenu.tsx                # User menu dropdown
```

## Database Schema

The app uses 7 Supabase tables with Row-Level Security:

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | FK → auth.users(id) |
| display_name | text | Default `''` |
| bio | text | Default `''` |
| birth_date | date | Nullable |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

### timelines
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| user_id | uuid | FK → auth.users(id) |
| name | text | Default `'My Life'` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

### lanes
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| timeline_id | uuid | FK → timelines(id) |
| name | text | |
| color | text | Default `'#3b82f6'` |
| visible | boolean | Default `true` |
| is_default | boolean | Default `false` |
| order | integer | Default `0` |

### events
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

### personas
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| name | text | |
| bio | text | Default `''` |
| birth_year | integer | |
| death_year | integer | Nullable |

### persona_events
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

### kanban_cards
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

## Key Concepts

### Timeline Rendering
- **Zoom:** `pixelsPerYear` ranges from 0.5 to 200 (default 80)
- **Positioning:** `left = (year - yearStart) * pixelsPerYear`
- **Year range:** 0–2500
- **Lane sidebar** is `sticky left-0` — scrolls vertically but stays pinned horizontally
- **Present-day line** rendered at the current fractional year
- **Past events** are dimmed relative to the current date

### Persona Overlays
Historical figures' timelines can be overlaid on your own, age-aligned to your birth year. Persona events are matched to lanes by name and rendered as sub-rows within each lane.

### Auth & Signup Flow
- Signup requires email, password, birth year, and a bio; birth date is optional
- After signup, extra profile fields are saved to `localStorage` (key: `timeline_pending_profile`)
- On first sign-in after email verification, pending data is applied to the user's profile
- Pending data expires after 30 days

### Kanban Board
A simple task board with three columns (Todo, In Progress, Done). Cards are drag-and-drop reorderable via @dnd-kit. Soft-deleted via an `archived` flag.
