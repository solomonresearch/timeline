import type { Lane, TimelineEvent } from '@/types/timeline'

// Uses the same standard lane IDs/names/emojis/colors as seedData.ts
export const DEMO_LANES: Lane[] = [
  { id: 'locations',     name: 'Locations',     emoji: '📍', color: '#3b82f6', visible: true, isDefault: true, order: 0 },
  { id: 'work',          name: 'Work',          emoji: '💼', color: '#10b981', visible: true, isDefault: true, order: 1 },
  { id: 'travel',        name: 'Travel',        emoji: '✈️', color: '#0ea5e9', visible: true, isDefault: true, order: 2 },
  { id: 'health',        name: 'Health',        emoji: '❤️', color: '#ef4444', visible: true, isDefault: true, order: 3 },
  { id: 'family',        name: 'Family',        emoji: '👨‍👩‍👧', color: '#f97316', visible: true, isDefault: true, order: 4 },
  { id: 'relationships', name: 'Relationships', emoji: '❤️‍🔥', color: '#ec4899', visible: true, isDefault: true, order: 5 },
  { id: 'education',     name: 'Education',     emoji: '🎓', color: '#8b5cf6', visible: true, isDefault: true, order: 6 },
  { id: 'activities',    name: 'Activities',    emoji: '🎯', color: '#f59e0b', visible: true, isDefault: true, order: 7 },
  { id: 'assets',        name: 'Assets',        emoji: '💰', color: '#14b8a6', visible: true, isDefault: true, order: 8 },
  { id: 'vehicles',      name: 'Vehicles',      emoji: '🚗', color: '#64748b', visible: true, isDefault: true, order: 9 },
  { id: 'items',         name: 'Items',         emoji: '📦', color: '#6366f1', visible: true, isDefault: true, order: 10 },
  { id: 'achievements',  name: 'Achievements',  emoji: '🏆', color: '#eab308', visible: true, isDefault: true, order: 11 },
]

export const DEMO_EVENTS: TimelineEvent[] = [
  // Locations
  { id: 'demo-evt-berlin',     laneId: 'locations',     emoji: '🏙️', title: 'Berlin',           description: 'Lived and worked in Berlin',     type: 'range', startYear: 2000, endYear: 2022, color: '#3b82f6' },
  { id: 'demo-evt-munich',     laneId: 'locations',     emoji: '🏔️', title: 'Munich',            description: 'Moved to Munich',                type: 'range', startYear: 2022, endYear: 2035, color: '#3b82f6' },

  // Work
  { id: 'demo-evt-work',       laneId: 'work',          emoji: '💻', title: 'Software Engineer', description: 'Full-stack developer',           type: 'range', startYear: 2005, endYear: 2027, color: '#10b981' },
  { id: 'demo-evt-newjob',     laneId: 'work',          emoji: '💼', title: '?New Job?',          description: 'Future opportunity',            type: 'range', startYear: 2027.5, endYear: 2037.5, color: '#059669',
    valueProjection: {
      startValue: 0,
      spotChanges: [],
      growthPeriods: [],
      deposits: [{ id: 'demo-dep-newjob', label: 'Monthly salary', amount: 10, frequency: 'monthly', startYear: 2027.5, endYear: 2037.5 }],
    },
  },
  { id: 'demo-evt-biz',        laneId: 'work',          emoji: '🏢', title: '?Own Business?',     description: 'Future venture',                type: 'range', startYear: 2038.5, endYear: 2058.5, color: '#0d9488',
    valueProjection: {
      startValue: 0,
      spotChanges: [],
      growthPeriods: [],
      deposits: [{ id: 'demo-dep-biz', label: 'Monthly income', amount: 20, frequency: 'monthly', startYear: 2038.5, endYear: 2058.5 }],
    },
  },

  // Health
  { id: 'demo-evt-leg',        laneId: 'health',        emoji: '🦴', title: 'Broke Left Leg',    description: 'Skiing accident in the Alps',    type: 'point', startYear: 2010, color: '#ef4444' },

  // Family
  { id: 'demo-evt-kid',        laneId: 'family',        emoji: '👶', title: 'Child',              description: 'First child born (2015)',        type: 'range', startYear: 2015, endYear: 2100, color: '#f97316' },

  // Relationships
  { id: 'demo-evt-girlfriend', laneId: 'relationships', emoji: '💕', title: 'First Girlfriend',   description: 'High school relationship',       type: 'range', startYear: 1996, endYear: 1999, color: '#ec4899' },
  { id: 'demo-evt-married',    laneId: 'relationships', emoji: '💍', title: 'Married',            description: 'Married',                       type: 'range', startYear: 2007, endYear: 2065, color: '#ec4899' },

  // Education
  { id: 'demo-evt-highschool', laneId: 'education',     emoji: '🏫', title: 'High School',        description: 'Gymnasium Berlin-Mitte',         type: 'range', startYear: 1994, endYear: 1999, color: '#8b5cf6' },
  { id: 'demo-evt-university', laneId: 'education',     emoji: '🎓', title: 'University (CS)',     description: 'TU Berlin, Computer Science',    type: 'range', startYear: 1999, endYear: 2004, color: '#8b5cf6' },

  // Activities
  { id: 'demo-evt-chess',      laneId: 'activities',    emoji: '♟️', title: 'Chess Club',         description: 'University chess club',          type: 'range', startYear: 2001, endYear: 2003, color: '#f59e0b' },

  // Assets
  { id: 'demo-evt-bank',       laneId: 'assets',        emoji: '💳', title: 'Savings Account',    description: 'Personal savings account',       type: 'range', startYear: 1998, endYear: 2065, color: '#14b8a6' },

  // Vehicles
  { id: 'demo-evt-volvo',      laneId: 'vehicles',      emoji: '🚗', title: 'Volvo',              description: 'Current car',                    type: 'range', startYear: 2021, endYear: 2031, color: '#64748b' },
  { id: 'demo-evt-vw',         laneId: 'vehicles',      emoji: '🚗', title: '?VW?',               description: 'Next car',                       type: 'range', startYear: 2032, endYear: 2037, color: '#64748b' },
  { id: 'demo-evt-boat',       laneId: 'vehicles',      emoji: '⛵', title: 'Boat',               description: 'Future boat',                    type: 'range', startYear: 2062, endYear: 2082, color: '#0ea5e9',
    valueProjection: {
      startValue: 0,
      spotChanges: [{ id: 'demo-vs-boat', year: 2062, amount: -100, label: 'Purchase' }],
      growthPeriods: [],
      deposits: [{ id: 'demo-dep-boat', label: 'Monthly running cost', amount: -10, frequency: 'monthly', startYear: 2062, endYear: 2082 }],
    },
  },

  // Achievements
  { id: 'demo-evt-nobel',      laneId: 'achievements',  title: '🏆 Nobel Prize',    description: 'Nobel Prize in Physics, 2050',  type: 'point', startYear: 2050, color: '#eab308' },
]
