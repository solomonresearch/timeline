import type { Lane, TimelineEvent } from '@/types/timeline'

export const defaultLanes: Lane[] = [
  { id: 'locations',      name: 'Locations',     emoji: '📍', color: '#3b82f6', visible: true, isDefault: true, order: 0 },
  { id: 'work',           name: 'Work',          emoji: '💼', color: '#10b981', visible: true, isDefault: true, order: 1 },
  { id: 'travel',         name: 'Travel',        emoji: '✈️', color: '#0ea5e9', visible: true, isDefault: true, order: 2 },
  { id: 'health',         name: 'Health',        emoji: '❤️', color: '#ef4444', visible: true, isDefault: true, order: 3 },
  { id: 'family',         name: 'Family',        emoji: '👨‍👩‍👧', color: '#f97316', visible: true, isDefault: true, order: 4 },
  { id: 'relationships',  name: 'Relationships', emoji: '❤️‍🔥', color: '#ec4899', visible: true, isDefault: true, order: 5 },
  { id: 'education',      name: 'Education',     emoji: '🎓', color: '#8b5cf6', visible: true, isDefault: true, order: 6 },
  { id: 'activities',     name: 'Activities',    emoji: '🎯', color: '#f59e0b', visible: true, isDefault: true, order: 7 },
  { id: 'assets',         name: 'Assets',        emoji: '💰', color: '#14b8a6', visible: true, isDefault: true, order: 8 },
  { id: 'vehicles',       name: 'Vehicles',      emoji: '🚗', color: '#64748b', visible: true, isDefault: true, order: 9 },
  { id: 'items',          name: 'Items',         emoji: '📦', color: '#6366f1', visible: true, isDefault: true, order: 10 },
  { id: 'achievements',   name: 'Achievements',  emoji: '🏆', color: '#eab308', visible: true, isDefault: true, order: 11 },
]

export const seedEvents: TimelineEvent[] = [
  // Locations
  { id: 'e1',  laneId: 'locations',     title: 'New York',         description: 'Grew up in NYC',              type: 'range', startYear: 1990, endYear: 2008 },
  { id: 'e2',  laneId: 'locations',     title: 'Boston',           description: 'College years',               type: 'range', startYear: 2008, endYear: 2012 },
  { id: 'e3',  laneId: 'locations',     title: 'San Francisco',    description: 'Moved for work',              type: 'range', startYear: 2012, endYear: 2020 },
  { id: 'e4',  laneId: 'locations',     title: 'Austin',           description: 'Remote work era',             type: 'range', startYear: 2020, endYear: 2026 },

  // Education
  { id: 'e5',  laneId: 'education',     title: 'MIT',              description: 'BS Computer Science',         type: 'range', startYear: 2008, endYear: 2012 },
  { id: 'e6',  laneId: 'education',     title: 'Stanford Online',  description: 'ML Certificate',              type: 'range', startYear: 2018, endYear: 2019 },

  // Work
  { id: 'e7',  laneId: 'work',          title: 'Google',           description: 'Software Engineer',           type: 'range', startYear: 2012, endYear: 2016 },
  { id: 'e8',  laneId: 'work',          title: 'Stripe',           description: 'Senior Engineer',             type: 'range', startYear: 2016, endYear: 2020 },
  { id: 'e9',  laneId: 'work',          title: 'Own Startup',      description: 'Founded a SaaS company',      type: 'range', startYear: 2020, endYear: 2026 },

  // Activities
  { id: 'e10', laneId: 'activities',    title: 'Marathon',         description: 'First marathon completed',    type: 'point', startYear: 2015 },
  { id: 'e11', laneId: 'activities',    title: 'Rock Climbing',    description: 'Regular climbing',            type: 'range', startYear: 2017, endYear: 2022 },
  { id: 'e12', laneId: 'activities',    title: 'Piano Lessons',    description: 'Learning piano',              type: 'range', startYear: 2023, endYear: 2025 },

  // Items
  { id: 'e13', laneId: 'items',         title: 'Parents\' Home',   description: 'Family house',                type: 'range', startYear: 1990, endYear: 2008 },
  { id: 'e14', laneId: 'items',         title: 'Dorm',             description: 'College dormitory',           type: 'range', startYear: 2008, endYear: 2012 },
  { id: 'e15', laneId: 'items',         title: 'Apartment',        description: 'Rented apartment in SF',      type: 'range', startYear: 2012, endYear: 2019 },
  { id: 'e16', laneId: 'items',         title: 'Own House',        description: 'Bought a house in Austin',    type: 'range', startYear: 2019, endYear: 2026 },

  // Assets
  { id: 'e17', laneId: 'assets',        title: 'First $100k',      description: 'Savings milestone',           type: 'point', startYear: 2015 },
  { id: 'e18', laneId: 'assets',        title: 'First $1M',        description: 'Net worth milestone',         type: 'point', startYear: 2021 },

  // Relationships
  { id: 'e19', laneId: 'relationships', title: 'Dating Sarah',     description: 'Started dating',              type: 'range', startYear: 2014, endYear: 2016 },
  { id: 'e20', laneId: 'relationships', title: 'Met Alex',         description: 'Met partner',                 type: 'point', startYear: 2017 },
  { id: 'e21', laneId: 'relationships', title: 'Married Alex',     description: 'Got married',                 type: 'range', startYear: 2019, endYear: 2026 },

  // Family
  { id: 'e22', laneId: 'family',        title: 'Emma born',        description: 'First child',                 type: 'point', startYear: 2021 },
  { id: 'e23', laneId: 'family',        title: 'Liam born',        description: 'Second child',                type: 'point', startYear: 2024 },
  { id: 'e24', laneId: 'family',        title: 'Parents together', description: 'Both parents alive and well', type: 'range', startYear: 1990, endYear: 2023 },
  { id: 'e25', laneId: 'family',        title: 'Dad passed',       description: 'Father passed away',          type: 'point', startYear: 2023 },

  // Vehicles
  { id: 'e26', laneId: 'vehicles',      title: 'Honda Civic',      description: 'First car',                   type: 'range', startYear: 2012, endYear: 2016 },
  { id: 'e27', laneId: 'vehicles',      title: 'Tesla Model 3',    description: 'Electric car',                type: 'range', startYear: 2016, endYear: 2022 },
  { id: 'e28', laneId: 'vehicles',      title: 'Rivian R1S',       description: 'Electric SUV',                type: 'range', startYear: 2022, endYear: 2026 },
]
