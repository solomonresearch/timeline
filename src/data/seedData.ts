import type { Lane, TimelineEvent } from '@/types/timeline'

export const defaultLanes: Lane[] = [
  { id: 'location',    name: 'Location',         color: '#3b82f6', visible: true, isDefault: true, order: 0 },
  { id: 'university',  name: 'University',        color: '#8b5cf6', visible: true, isDefault: true, order: 1 },
  { id: 'work',        name: 'Work',              color: '#10b981', visible: true, isDefault: true, order: 2 },
  { id: 'activities',  name: 'Other Activities',  color: '#f59e0b', visible: true, isDefault: true, order: 3 },
  { id: 'house',       name: 'Type of House',     color: '#6366f1', visible: true, isDefault: true, order: 4 },
  { id: 'wealth',      name: 'Wealth',            color: '#14b8a6', visible: true, isDefault: true, order: 5 },
  { id: 'relations',   name: 'Relations',         color: '#ec4899', visible: true, isDefault: true, order: 6 },
  { id: 'kids',        name: 'Kids',              color: '#f97316', visible: true, isDefault: true, order: 7 },
  { id: 'parents',     name: 'Parents',           color: '#84cc16', visible: true, isDefault: true, order: 8 },
  { id: 'cars',        name: 'Cars',              color: '#64748b', visible: true, isDefault: true, order: 9 },
]

export const seedEvents: TimelineEvent[] = [
  // Location
  { id: 'e1',  laneId: 'location',   title: 'New York',         description: 'Grew up in NYC',              type: 'range', startYear: 1990, endYear: 2008 },
  { id: 'e2',  laneId: 'location',   title: 'Boston',           description: 'College years',               type: 'range', startYear: 2008, endYear: 2012 },
  { id: 'e3',  laneId: 'location',   title: 'San Francisco',    description: 'Moved for work',              type: 'range', startYear: 2012, endYear: 2020 },
  { id: 'e4',  laneId: 'location',   title: 'Austin',           description: 'Remote work era',             type: 'range', startYear: 2020, endYear: 2026 },

  // University
  { id: 'e5',  laneId: 'university', title: 'MIT',              description: 'BS Computer Science',         type: 'range', startYear: 2008, endYear: 2012 },
  { id: 'e6',  laneId: 'university', title: 'Stanford Online',  description: 'ML Certificate',              type: 'range', startYear: 2018, endYear: 2019 },

  // Work
  { id: 'e7',  laneId: 'work',       title: 'Google',           description: 'Software Engineer',           type: 'range', startYear: 2012, endYear: 2016 },
  { id: 'e8',  laneId: 'work',       title: 'Stripe',           description: 'Senior Engineer',             type: 'range', startYear: 2016, endYear: 2020 },
  { id: 'e9',  laneId: 'work',       title: 'Own Startup',      description: 'Founded a SaaS company',      type: 'range', startYear: 2020, endYear: 2026 },

  // Activities
  { id: 'e10', laneId: 'activities', title: 'Marathon',          description: 'First marathon completed',    type: 'point', startYear: 2015 },
  { id: 'e11', laneId: 'activities', title: 'Rock Climbing',     description: 'Regular climbing',            type: 'range', startYear: 2017, endYear: 2022 },
  { id: 'e12', laneId: 'activities', title: 'Piano Lessons',     description: 'Learning piano',              type: 'range', startYear: 2023, endYear: 2025 },

  // House
  { id: 'e13', laneId: 'house',      title: 'Parents\' Home',   description: 'Family house',                type: 'range', startYear: 1990, endYear: 2008 },
  { id: 'e14', laneId: 'house',      title: 'Dorm',             description: 'College dormitory',           type: 'range', startYear: 2008, endYear: 2012 },
  { id: 'e15', laneId: 'house',      title: 'Apartment',        description: 'Rented apartment in SF',      type: 'range', startYear: 2012, endYear: 2019 },
  { id: 'e16', laneId: 'house',      title: 'Own House',        description: 'Bought a house in Austin',    type: 'range', startYear: 2019, endYear: 2026 },

  // Wealth
  { id: 'e17', laneId: 'wealth',     title: 'First $100k',      description: 'Savings milestone',           type: 'point', startYear: 2015 },
  { id: 'e18', laneId: 'wealth',     title: 'First $1M',        description: 'Net worth milestone',         type: 'point', startYear: 2021 },

  // Relations
  { id: 'e19', laneId: 'relations',  title: 'Dating Sarah',     description: 'Started dating',              type: 'range', startYear: 2014, endYear: 2016 },
  { id: 'e20', laneId: 'relations',  title: 'Met Alex',         description: 'Met partner',                 type: 'point', startYear: 2017 },
  { id: 'e21', laneId: 'relations',  title: 'Married Alex',     description: 'Got married',                 type: 'range', startYear: 2019, endYear: 2026 },

  // Kids
  { id: 'e22', laneId: 'kids',       title: 'Emma born',        description: 'First child',                 type: 'point', startYear: 2021 },
  { id: 'e23', laneId: 'kids',       title: 'Liam born',        description: 'Second child',                type: 'point', startYear: 2024 },

  // Parents
  { id: 'e24', laneId: 'parents',    title: 'Parents together',  description: 'Both parents alive and well', type: 'range', startYear: 1990, endYear: 2023 },
  { id: 'e25', laneId: 'parents',    title: 'Dad passed',        description: 'Father passed away',          type: 'point', startYear: 2023 },

  // Cars
  { id: 'e26', laneId: 'cars',       title: 'Honda Civic',      description: 'First car',                   type: 'range', startYear: 2012, endYear: 2016 },
  { id: 'e27', laneId: 'cars',       title: 'Tesla Model 3',    description: 'Electric car',                type: 'range', startYear: 2016, endYear: 2022 },
  { id: 'e28', laneId: 'cars',       title: 'Rivian R1S',       description: 'Electric SUV',                type: 'range', startYear: 2022, endYear: 2026 },
]
