-- ============================================================
-- 002_seed_personas.sql — Famous person personas + events
-- Lane names match the standard default lanes (seedData.ts)
-- ============================================================

-- Elon Musk
insert into public.personas (id, name, bio, birth_year, death_year)
values ('a0000000-0000-0000-0000-000000000001', 'Elon Musk', 'Entrepreneur, CEO of Tesla and SpaceX', 1971, null);

insert into public.persona_events (persona_id, lane_name, title, description, type, start_year, end_year, color) values
  ('a0000000-0000-0000-0000-000000000001', 'Locations',     'Pretoria, South Africa', 'Born and raised',                   'range', 1971, 1989, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000001', 'Locations',     'Canada',                 'Moved to attend Queens University',  'range', 1989, 1992, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000001', 'Locations',     'USA',                    'Transferred to UPenn, then Silicon Valley', 'range', 1992, 2026, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000001', 'Education',     'Queens University',      'Transferred after 2 years',          'range', 1989, 1992, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000001', 'Education',     'UPenn (Wharton + Physics)', 'BS Economics + BS Physics',       'range', 1992, 1997, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000001', 'Work',          'Zip2',                   'Co-founded web software company',   'range', 1995, 1999, '#10b981'),
  ('a0000000-0000-0000-0000-000000000001', 'Work',          'X.com / PayPal',         'Co-founded, merged into PayPal',    'range', 1999, 2002, '#10b981'),
  ('a0000000-0000-0000-0000-000000000001', 'Work',          'SpaceX',                 'Founded and CEO',                   'range', 2002, 2026, '#10b981'),
  ('a0000000-0000-0000-0000-000000000001', 'Work',          'Tesla',                  'Joined as chairman, became CEO',    'range', 2004, 2026, '#059669'),
  ('a0000000-0000-0000-0000-000000000001', 'Relationships', 'Married Justine Wilson', 'First marriage',                    'range', 2000, 2008, '#ec4899'),
  ('a0000000-0000-0000-0000-000000000001', 'Relationships', 'Married Talulah Riley',  'Second marriage (twice)',           'range', 2010, 2016, '#ec4899'),
  ('a0000000-0000-0000-0000-000000000001', 'Family',        'Nevada born',            'First child',                       'point', 2002, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000001', 'Family',        'Twins born',             'Saxon and Damian',                  'point', 2004, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000001', 'Assets',        'First $100M',            'PayPal acquisition payout',         'point', 2002, null,  '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000001', 'Assets',        'Became richest person',  'Surpassed Jeff Bezos',              'point', 2021, null,  '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000001', 'Activities',    'OpenAI co-founded',      'AI research org',                   'point', 2015, null,  '#f59e0b');

-- Steve Jobs
insert into public.personas (id, name, bio, birth_year, death_year)
values ('a0000000-0000-0000-0000-000000000002', 'Steve Jobs', 'Co-founder of Apple, Pixar', 1955, 2011);

insert into public.persona_events (persona_id, lane_name, title, description, type, start_year, end_year, color) values
  ('a0000000-0000-0000-0000-000000000002', 'Locations',     'San Francisco',          'Born in SF',                        'point', 1955, null,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000002', 'Locations',     'Los Altos, CA',          'Grew up in Silicon Valley',         'range', 1955, 1972, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000002', 'Locations',     'Palo Alto / Cupertino',  'Apple years',                       'range', 1976, 2011, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000002', 'Education',     'Reed College',           'Dropped out after 1 semester',      'range', 1972, 1974, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000002', 'Work',          'Atari',                  'Technician',                        'range', 1974, 1976, '#10b981'),
  ('a0000000-0000-0000-0000-000000000002', 'Work',          'Apple (1st stint)',       'Co-founded Apple Computer',         'range', 1976, 1985, '#10b981'),
  ('a0000000-0000-0000-0000-000000000002', 'Work',          'NeXT',                   'Founded after leaving Apple',       'range', 1985, 1997, '#059669'),
  ('a0000000-0000-0000-0000-000000000002', 'Work',          'Pixar',                  'Bought and grew into animation giant', 'range', 1986, 2006, '#0d9488'),
  ('a0000000-0000-0000-0000-000000000002', 'Work',          'Apple (return)',          'CEO, launched iPod/iPhone/iPad',   'range', 1997, 2011, '#10b981'),
  ('a0000000-0000-0000-0000-000000000002', 'Relationships', 'Married Laurene Powell', 'Lifelong partner',                  'range', 1991, 2011, '#ec4899'),
  ('a0000000-0000-0000-0000-000000000002', 'Family',        'Lisa born',              'Daughter with Chrisann Brennan',    'point', 1978, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000002', 'Family',        'Reed born',              'Son with Laurene',                  'point', 1991, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000002', 'Assets',        'Apple IPO',              'Worth $256M at age 25',             'point', 1980, null,  '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000002', 'Assets',        'Pixar IPO',              'Worth over $1B',                    'point', 1995, null,  '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000002', 'Activities',    'India trip',             'Spiritual journey',                 'point', 1974, null,  '#f59e0b');

-- Albert Einstein
insert into public.personas (id, name, bio, birth_year, death_year)
values ('a0000000-0000-0000-0000-000000000003', 'Albert Einstein', 'Theoretical physicist, Nobel laureate', 1879, 1955);

insert into public.persona_events (persona_id, lane_name, title, description, type, start_year, end_year, color) values
  ('a0000000-0000-0000-0000-000000000003', 'Locations',     'Ulm, Germany',           'Birthplace',                        'point', 1879, null,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000003', 'Locations',     'Munich',                 'Childhood',                         'range', 1880, 1894, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000003', 'Locations',     'Zurich / Bern',          'Swiss years',                       'range', 1895, 1914, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000003', 'Locations',     'Berlin',                 'Professor in Berlin',               'range', 1914, 1933, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000003', 'Locations',     'Princeton, NJ',          'Emigrated to USA',                  'range', 1933, 1955, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000003', 'Education',     'ETH Zurich',             'Physics & math diploma',            'range', 1896, 1900, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000003', 'Work',          'Swiss Patent Office',    'Patent clerk',                      'range', 1902, 1909, '#10b981'),
  ('a0000000-0000-0000-0000-000000000003', 'Work',          'University of Zurich',   'Professor',                         'range', 1909, 1914, '#10b981'),
  ('a0000000-0000-0000-0000-000000000003', 'Work',          'Prussian Academy of Sciences', 'Director',                   'range', 1914, 1933, '#059669'),
  ('a0000000-0000-0000-0000-000000000003', 'Work',          'IAS Princeton',          'Professor until death',             'range', 1933, 1955, '#10b981'),
  ('a0000000-0000-0000-0000-000000000003', 'Relationships', 'Married Mileva Maric',   'First wife',                        'range', 1903, 1919, '#ec4899'),
  ('a0000000-0000-0000-0000-000000000003', 'Relationships', 'Married Elsa Einstein',  'Second wife (cousin)',              'range', 1919, 1936, '#ec4899'),
  ('a0000000-0000-0000-0000-000000000003', 'Family',        'Hans Albert born',       'First son',                         'point', 1904, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000003', 'Family',        'Eduard born',            'Second son',                        'point', 1910, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000003', 'Activities',    'Annus Mirabilis papers', 'Special relativity, E=mc2',         'point', 1905, null,  '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000003', 'Activities',    'Nobel Prize in Physics', 'Photoelectric effect',              'point', 1921, null,  '#f59e0b');

-- Marie Curie
insert into public.personas (id, name, bio, birth_year, death_year)
values ('a0000000-0000-0000-0000-000000000004', 'Marie Curie', 'Physicist and chemist, two-time Nobel laureate', 1867, 1934);

insert into public.persona_events (persona_id, lane_name, title, description, type, start_year, end_year, color) values
  ('a0000000-0000-0000-0000-000000000004', 'Locations',     'Warsaw, Poland',         'Born and raised',                   'range', 1867, 1891, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000004', 'Locations',     'Paris, France',          'Moved for studies, stayed for life','range', 1891, 1934, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000004', 'Education',     'University of Paris',    'Physics and math degrees',          'range', 1891, 1894, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000004', 'Work',          'Research on radioactivity', 'Discovered polonium and radium', 'range', 1897, 1906, '#10b981'),
  ('a0000000-0000-0000-0000-000000000004', 'Work',          'Professor at Sorbonne',  'First female professor',            'range', 1906, 1934, '#10b981'),
  ('a0000000-0000-0000-0000-000000000004', 'Work',          'Radium Institute',       'Founded and directed',              'range', 1914, 1934, '#059669'),
  ('a0000000-0000-0000-0000-000000000004', 'Relationships', 'Married Pierre Curie',   'Scientific partnership and marriage','range', 1895, 1906, '#ec4899'),
  ('a0000000-0000-0000-0000-000000000004', 'Family',        'Irene born',             'Future Nobel laureate daughter',    'point', 1897, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000004', 'Family',        'Eve born',               'Second daughter',                   'point', 1904, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000004', 'Activities',    'Nobel Prize in Physics', 'Shared with Pierre and Becquerel',  'point', 1903, null,  '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000004', 'Activities',    'Nobel Prize in Chemistry','For discovery of radium and polonium','point', 1911, null, '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000004', 'Activities',    'Mobile X-ray units (WWI)','Petites Curies for field hospitals','range', 1914, 1918, '#f59e0b');

-- Leonardo da Vinci
insert into public.personas (id, name, bio, birth_year, death_year)
values ('a0000000-0000-0000-0000-000000000005', 'Leonardo da Vinci', 'Renaissance polymath: artist, inventor, scientist', 1452, 1519);

insert into public.persona_events (persona_id, lane_name, title, description, type, start_year, end_year, color) values
  ('a0000000-0000-0000-0000-000000000005', 'Locations',     'Vinci, Italy',           'Birthplace',                        'range', 1452, 1466, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000005', 'Locations',     'Florence',               'Apprenticeship and early career',   'range', 1466, 1482, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000005', 'Locations',     'Milan',                  'Court of Ludovico Sforza',          'range', 1482, 1499, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000005', 'Locations',     'Florence / Rome / France','Later years',                     'range', 1500, 1519, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000005', 'Work',          'Verrocchios Workshop',   'Apprentice to Andrea del Verrocchio','range', 1466, 1478, '#10b981'),
  ('a0000000-0000-0000-0000-000000000005', 'Work',          'Independent Artist',     'Established own studio in Florence','range', 1478, 1482, '#10b981'),
  ('a0000000-0000-0000-0000-000000000005', 'Work',          'Court Artist & Engineer','Served Duke of Milan',              'range', 1482, 1499, '#059669'),
  ('a0000000-0000-0000-0000-000000000005', 'Work',          'Premier Painter of France','Under King Francis I',            'range', 1516, 1519, '#10b981'),
  ('a0000000-0000-0000-0000-000000000005', 'Activities',    'The Last Supper',        'Painted iconic mural',              'range', 1495, 1498, '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000005', 'Activities',    'Mona Lisa',              'Began the famous portrait',         'range', 1503, 1519, '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000005', 'Activities',    'Vitruvian Man',          'Study of human proportions',        'point', 1490, null,  '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000005', 'Activities',    'Flying machine designs', 'Extensive aeronautics studies',     'range', 1488, 1505, '#f59e0b');
