# Timeline

A personal timeline application for visualizing life events, achievements, and milestones — where you lived, worked, studied, your earnings, and wealth over time.

Built with React (frontend) and Node.js (backend).

## Features

- **Life Events Timeline** — Chronological visualization of key moments: education, career, relocations, personal milestones
- **Categories** — Filter by event type: Work, Education, Residence, Achievement, Financial
- **Wealth & Earnings Tracker** — Visualize income and net worth progression over time
- **Interactive UI** — Zoom, scroll, and click into events for details
- **Data Entry** — Add, edit, and delete life events through a simple interface

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** SQLite (local) / PostgreSQL (production)
- **Charts:** Recharts for financial visualizations

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/solomonresearch/timeline.git
cd timeline

# Install dependencies
npm install

# Start development server
npm run dev
```

### Project Structure

```
timeline/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route pages
│   │   ├── hooks/       # Custom hooks
│   │   └── utils/       # Helpers
│   └── public/
├── server/          # Node.js backend
│   ├── routes/      # API routes
│   ├── models/      # Data models
│   └── db/          # Database config & migrations
├── package.json
└── README.md
```

## Event Types

| Category | Examples |
|----------|----------|
| Residence | Cities/countries lived in, moves |
| Education | Schools, degrees, certifications |
| Work | Jobs, promotions, career changes |
| Financial | Salary changes, investments, net worth milestones |
| Achievement | Awards, publications, personal goals |
| Life | Relationships, travel, health milestones |

## License

MIT
