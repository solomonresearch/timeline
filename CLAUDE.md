# CLAUDE.md — Life Timeline App

## Project Overview

Personal life timeline visualization — horizontal swim-lane view of life events across dimensions (location, work, education, relations, etc.). React SPA with all data in client-side state (no backend).

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
- **UI Components:** shadcn/ui (Radix primitives + CVA + Tailwind)
- **Icons:** Lucide React
- **Package Manager:** npm

## Commands

```bash
npm install          # Install all dependencies
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Production build (tsc + vite build)
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Architecture

### File Structure (`src/`)
```
src/
├── types/timeline.ts          # Lane, TimelineEvent type definitions
├── data/seedData.ts           # Default lanes (10) + sample events
├── hooks/useTimeline.ts       # State management (lanes, events, CRUD)
├── lib/utils.ts               # cn() utility for Tailwind class merging
├── components/
│   ├── ui/                    # shadcn/ui primitives (button, dialog, etc.)
│   ├── timeline/
│   │   ├── TimelineContainer  # Main layout: sidebar + scrollable area
│   │   ├── TimelineHeader     # Sticky year labels + tick marks
│   │   ├── TimelineLane       # Single swim lane with events
│   │   ├── TimelineEvent      # Rendered event (bar for range, dot for point)
│   │   ├── YearGrid           # Vertical dashed year lines
│   │   └── LaneSidebar        # Lane labels, visibility toggle, dropdown menu
│   ├── dialogs/
│   │   ├── EventDialog        # Add/Edit event form
│   │   ├── LaneDialog         # Add/Edit lane form
│   │   └── DeleteConfirmDialog # Confirmation before delete
│   ├── EventPopover           # Click-on-event detail popover
│   └── Toolbar                # Top bar: title, zoom slider, add buttons
├── App.tsx                    # Root component wiring everything together
├── main.tsx                   # Entry point
└── index.css                  # Tailwind imports + theme variables
```

### Data Model
- **Lane:** id, name, color, visible, isDefault, order
- **TimelineEvent:** id, laneId, title, description, type (`range`|`point`), startYear (float), endYear?, color?
- **Default lanes:** Location, University, Work, Other Activities, Type of House, Wealth, Relations, Kids, Parents, Cars

### Key Patterns
- `pixelsPerYear` controls zoom (40–200px, default 80)
- Position formula: `left = (year - yearStart) * pixelsPerYear`
- Range events → colored rounded bars; point events → colored dots
- Lane sidebar is `sticky left-0` — scrolls vertically with lanes but not horizontally
- All state in `useTimeline` hook — no external state library

## Code Standards

- ES modules (`import/export`), no CommonJS
- TypeScript strict mode
- Functional components with hooks only
- PascalCase components, camelCase utilities
- Path alias: `@/` → `src/`
- Tailwind CSS for styling — no CSS modules or styled-components

## Git

- Branch from `master`
- Commit messages: `type: description` (feat, fix, docs, refactor, test, chore)
- Keep commits focused — one logical change per commit
