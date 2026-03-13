-- ============================================================
-- 020_persona_events_enriched.sql
-- Replace all persona events with comprehensive data covering
-- all default lanes: Locations, Work, Travel, Health, Family,
-- Relationships, Education, Activities, Assets, Vehicles,
-- Items, Achievements
-- ============================================================

-- Clear existing events and personas (events first due to FK)
DELETE FROM public.persona_events WHERE persona_id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005'
);

DELETE FROM public.personas WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005'
);

-- ============================================================
-- ELON MUSK  (born 28 Jun 1971)
-- ============================================================
INSERT INTO public.personas (id, name, bio, birth_year, death_year) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Elon Musk',
  'Entrepreneur and industrialist. CEO of Tesla & SpaceX, owner of X (Twitter), co-founder of Neuralink and OpenAI. Born in Pretoria, South Africa; immigrated to North America at 17. Became the world''s wealthiest person in 2021. Transforming electric vehicles, reusable rockets, AI, and global internet access.',
  1971, null
);

INSERT INTO public.persona_events (persona_id, lane_name, title, description, type, start_year, end_year, color) VALUES
  -- Locations
  ('a0000000-0000-0000-0000-000000000001', 'Locations', 'Pretoria, South Africa',       'Born and raised in Pretoria; father Errol Musk was an engineer and pilot',                              'range', 1971, 1989, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000001', 'Locations', 'Kingston, Ontario, Canada',    'Immigrated via mother''s Canadian citizenship; attended Queen''s University',                           'range', 1989, 1992, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000001', 'Locations', 'Philadelphia, PA',             'Transferred to University of Pennsylvania (Wharton + Physics)',                                         'range', 1992, 1995, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000001', 'Locations', 'Palo Alto / Silicon Valley',   'Moved to start Stanford PhD; dropped out after 2 days to found Zip2',                                  'range', 1995, 2013, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000001', 'Locations', 'Los Angeles / Bel Air',        'Multiple luxury mansions in Bel Air; later sold every property he owned',                               'range', 2013, 2020, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000001', 'Locations', 'Boca Chica / Austin, TX',      'Relocated to Texas Dec 2020; lives in ~$50k prefab home near SpaceX Starbase',                         'range', 2020, 2026, '#3b82f6'),
  -- Education
  ('a0000000-0000-0000-0000-000000000001', 'Education', 'Waterkloof House Preparatory', 'Primary school in Pretoria; self-taught programming from age 9',                                        'range', 1979, 1984, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000001', 'Education', 'Pretoria Boys High School',    'Secondary school; severely bullied; sold homemade video game "Blastar" aged 12',                        'range', 1984, 1989, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000001', 'Education', 'Queen''s University, Ontario', 'Economics and physics; transferred to UPenn after two years',                                           'range', 1989, 1992, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000001', 'Education', 'UPenn — Wharton & Physics',    'BS Economics (Wharton) and BS Physics; graduated 1997',                                                 'range', 1992, 1997, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000001', 'Education', 'Stanford PhD (2 days)',         'Accepted into energy physics PhD programme; left after 2 days to co-found Zip2',                       'point', 1995, null,  '#8b5cf6'),
  -- Work
  ('a0000000-0000-0000-0000-000000000001', 'Work', 'Zip2',               'Co-founded with brother Kimbal; city-guide software sold to Compaq for $307M',                              'range', 1995, 1999, '#10b981'),
  ('a0000000-0000-0000-0000-000000000001', 'Work', 'X.com / PayPal',     'Founded online bank X.com; merged with Confinity to form PayPal; sold to eBay for $1.5B',                   'range', 1999, 2002, '#10b981'),
  ('a0000000-0000-0000-0000-000000000001', 'Work', 'SpaceX',             'Founded to slash cost of space travel; Falcon 9, Dragon, Starship; Starlink internet',                       'range', 2002, 2026, '#059669'),
  ('a0000000-0000-0000-0000-000000000001', 'Work', 'Tesla',              'Joined as chairman and lead investor 2004; became CEO 2008; transformed global EV market',                   'range', 2004, 2026, '#10b981'),
  ('a0000000-0000-0000-0000-000000000001', 'Work', 'SolarCity',          'Co-founded with cousins Lyndon & Peter Rive; solar energy services; acquired by Tesla 2016',               'range', 2006, 2016, '#047857'),
  ('a0000000-0000-0000-0000-000000000001', 'Work', 'OpenAI (co-founder)','Co-founded non-profit AI safety lab with $1B pledge; departed board 2018',                                  'range', 2015, 2018, '#047857'),
  ('a0000000-0000-0000-0000-000000000001', 'Work', 'Neuralink',          'Brain-computer interface company; first human implant Jan 2024',                                            'range', 2016, 2026, '#10b981'),
  ('a0000000-0000-0000-0000-000000000001', 'Work', 'The Boring Company', 'Tunnel construction startup; Las Vegas Loop operational 2021',                                              'range', 2016, 2026, '#047857'),
  ('a0000000-0000-0000-0000-000000000001', 'Work', 'Twitter / X',        'Acquired for $44B Oct 2022; rebranded to X; pursuing "everything app" vision',                              'range', 2022, 2026, '#10b981'),
  ('a0000000-0000-0000-0000-000000000001', 'Work', 'xAI',               'AI company; launched Grok chatbot; raised $6B Series B',                                                    'range', 2023, 2026, '#059669'),
  ('a0000000-0000-0000-0000-000000000001', 'Work', 'DOGE',               'Head of Dept of Government Efficiency; advising US federal spending cuts under Trump',                      'range', 2025, 2026, '#047857'),
  -- Travel
  ('a0000000-0000-0000-0000-000000000001', 'Travel', 'South Africa → Canada',           'Left Pretoria at 17; immigrated to Canada via mother''s citizenship to avoid military service',         'point', 1989, null,  '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000001', 'Travel', 'Russia — rocket purchase',        'Visited Russia 3× trying to buy decommissioned ICBMs cheaply; Russians refused; inspired SpaceX',      'point', 2002, null,  '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000001', 'Travel', 'Boca Chica, TX (SpaceX)',         'Regular visits to Starbase during Starship development; later relocated nearby',                        'range', 2019, 2026, '#0ea5e9'),
  -- Health
  ('a0000000-0000-0000-0000-000000000001', 'Health', 'Hospitalised after bullying',     'Severely beaten by gang of boys at school; hospitalised; suffered long-term effects',                   'point', 1986, null,  '#ef4444'),
  ('a0000000-0000-0000-0000-000000000001', 'Health', 'Near-fatal malaria',              'Contracted malaria on trip to South Africa; critically ill for months; nearly ended his life',           'range', 2000, 2001, '#ef4444'),
  ('a0000000-0000-0000-0000-000000000001', 'Health', 'Extreme stress (SpaceX/Tesla)',   '2008: both SpaceX and Tesla nearly bankrupt simultaneously; described as worst year of his life',       'range', 2008, 2009, '#ef4444'),
  -- Relationships
  ('a0000000-0000-0000-0000-000000000001', 'Relationships', 'Justine Wilson',           'Canadian author; married Jan 2000; 6 children together; divorced 2008',                                'range', 2000, 2008, '#ec4899'),
  ('a0000000-0000-0000-0000-000000000001', 'Relationships', 'Talulah Riley',            'British actress; married 2010, divorced 2012, remarried 2013, divorced 2016',                          'range', 2010, 2016, '#ec4899'),
  ('a0000000-0000-0000-0000-000000000001', 'Relationships', 'Grimes',                   'Canadian musician Claire Boucher; relationship 2018–2022; 3 children together',                        'range', 2018, 2022, '#ec4899'),
  -- Family
  ('a0000000-0000-0000-0000-000000000001', 'Family', 'Nevada Alexander (died)',         'First son with Justine; died of SIDS at 10 weeks old; deeply affected Musk',                           'point', 2002, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000001', 'Family', 'Griffin & Xavier (twins)',        'Twin sons with Justine; born 2004; Xavier later changed name to Vivian',                               'point', 2004, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000001', 'Family', 'Damian, Saxon & Kai (triplets)', 'Triplet sons with Justine; born 2006',                                                                  'point', 2006, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000001', 'Family', 'X AE A-XII (with Grimes)',        'Son with Grimes; born May 2020; unusual name became international news',                               'point', 2020, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000001', 'Family', 'Twins with Shivon Zilis',         'Born Nov 2021; mother is Neuralink executive; initially kept private',                                 'point', 2021, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000001', 'Family', 'Exa Dark Sidereal (with Grimes)','Daughter with Grimes via surrogate; born Dec 2021',                                                    'point', 2021, null,  '#f97316'),
  -- Assets
  ('a0000000-0000-0000-0000-000000000001', 'Assets', 'Zip2 sale — $22M',               'Personal payout from Compaq''s $307M acquisition; first major windfall',                               'point', 1999, null,  '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000001', 'Assets', 'PayPal sale — $180M',            'Personal share from eBay''s $1.5B buy; immediately reinvested all into SpaceX and Tesla',              'point', 2002, null,  '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000001', 'Assets', 'First billionaire milestone',     'Forbes listed Musk at ~$2B in 2012; equity largely held in Tesla and SpaceX',                         'point', 2012, null,  '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000001', 'Assets', 'Sold all Bel Air mansions',       'Publicly vowed to own no fixed residence; sold six California properties 2020–2021',                  'range', 2020, 2021, '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000001', 'Assets', 'World''s richest person',         'Surpassed Jeff Bezos Jan 2021; briefly held $300B+ net worth; lost most in Twitter deal',             'point', 2021, null,  '#14b8a6'),
  -- Vehicles
  ('a0000000-0000-0000-0000-000000000001', 'Vehicles', 'Tesla Roadster (1st gen)',      'Early adopter and promoter; used as personal daily driver to prove EVs work',                          'range', 2008, 2012, '#64748b'),
  ('a0000000-0000-0000-0000-000000000001', 'Vehicles', 'Tesla Model S',                 'Primary personal car for years; filmed himself using Autopilot to demonstrate safety',                 'range', 2012, 2020, '#64748b'),
  ('a0000000-0000-0000-0000-000000000001', 'Vehicles', 'Tesla Cybertruck',              'Drove Cybertruck as daily driver after launch; high-profile real-world usage',                         'range', 2023, 2026, '#64748b'),
  ('a0000000-0000-0000-0000-000000000001', 'Vehicles', 'Private jets (Gulfstream)',     'Maintains fleet of private jets; flight tracker @ElonJet became major PR controversy',                 'range', 2010, 2026, '#64748b'),
  -- Items
  ('a0000000-0000-0000-0000-000000000001', 'Items', 'Bel Air mansions (×6)',            'Bought and renovated multiple mansions in Bel Air CA; sold entire portfolio 2020–2021',                'range', 2013, 2021, '#6366f1'),
  ('a0000000-0000-0000-0000-000000000001', 'Items', 'Boxabl Casita prefab home',        'Rents a ~$50k prefab tiny home near SpaceX Starbase Boca Chica, TX',                                  'range', 2021, 2026, '#6366f1'),
  -- Achievements
  ('a0000000-0000-0000-0000-000000000001', 'Achievements', 'Falcon 1 reaches orbit',          'First privately-funded liquid-propellant rocket to reach Earth orbit',                            'point', 2008, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000001', 'Achievements', 'Dragon docks with ISS',           'First private spacecraft to dock with the International Space Station',                           'point', 2012, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000001', 'Achievements', 'Falcon 9 booster landing',        'First orbital-class rocket booster to land vertically and be reused (Dec 2015)',                 'point', 2015, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000001', 'Achievements', 'Falcon Heavy + Tesla in space',   'Most powerful operational rocket launched; his own Tesla Roadster sent to Mars orbit',           'point', 2018, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000001', 'Achievements', 'Crew Dragon — crewed ISS flight', 'First private crewed spacecraft; ended US dependence on Russian Soyuz for ISS access',           'point', 2020, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000001', 'Achievements', 'Tesla — world''s most valuable car company', 'Market cap surpassed Toyota; reached $800B+ valuation',                              'point', 2021, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000001', 'Achievements', 'Starship — first full flight',    'Largest rocket ever built completed first full integrated flight test (IFT-4)',                   'point', 2024, null,  '#eab308');


-- ============================================================
-- STEVE JOBS  (born 24 Feb 1955, died 5 Oct 2011)
-- ============================================================
INSERT INTO public.personas (id, name, bio, birth_year, death_year) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'Steve Jobs',
  'Co-founder and visionary CEO of Apple Inc. and Pixar Animation Studios. Pioneer of the personal computer revolution, digital music, and the smartphone era. His products — Macintosh, iPod, iPhone, iPad — reshaped entire industries. Died Oct 5 2011 from pancreatic cancer.',
  1955, 2011
);

INSERT INTO public.persona_events (persona_id, lane_name, title, description, type, start_year, end_year, color) VALUES
  -- Locations
  ('a0000000-0000-0000-0000-000000000002', 'Locations', 'Mountain View / Los Altos, CA', 'Adopted by Paul and Clara Jobs; grew up in Silicon Valley neighbourhood',                             'range', 1955, 1972, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000002', 'Locations', 'Portland, OR',                  'Reed College campus; dropped out after one semester but stayed 18 months auditing classes',           'range', 1972, 1974, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000002', 'Locations', 'Los Altos / Cupertino, CA',     'Returned home; worked at Atari; co-founded Apple in family garage',                                   'range', 1974, 1991, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000002', 'Locations', 'Palo Alto, CA',                 'Family home on Waverley St with Laurene; lived there until his death in 2011',                        'range', 1991, 2011, '#3b82f6'),
  -- Education
  ('a0000000-0000-0000-0000-000000000002', 'Education', 'Reed College, Portland',        'Enrolled autumn 1972; dropped out after one semester; stayed 18 months auditing classes incl. calligraphy', 'range', 1972, 1974, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000002', 'Education', 'Calligraphy at Reed',           'Audited calligraphy course after dropping out; directly inspired Mac''s proportional typefaces',     'range', 1973, 1974, '#8b5cf6'),
  -- Work
  ('a0000000-0000-0000-0000-000000000002', 'Work', 'Atari',                'Hired as technician; helped design Breakout game; funded India trip from wages',                                   'range', 1974, 1976, '#10b981'),
  ('a0000000-0000-0000-0000-000000000002', 'Work', 'Apple — 1st era',     'Co-founded with Wozniak & Wayne in parents'' garage; Apple I, II; Macintosh; ousted by board 1985',              'range', 1976, 1985, '#10b981'),
  ('a0000000-0000-0000-0000-000000000002', 'Work', 'NeXT',                'Founded after leaving Apple; pioneering OS and hardware; acquired by Apple 1997 for $429M',                        'range', 1985, 1997, '#059669'),
  ('a0000000-0000-0000-0000-000000000002', 'Work', 'Pixar',               'Bought from Lucasfilm for $10M; produced Toy Story; Pixar IPO 1995; sold to Disney for $7.4B in 2006',           'range', 1986, 2006, '#0d9488'),
  ('a0000000-0000-0000-0000-000000000002', 'Work', 'Apple — return era',  'Returned as interim CEO 1997; launched iMac, iPod, iTunes, iPhone, iPad; made Apple world''s most valuable co.','range', 1997, 2011, '#10b981'),
  -- Travel
  ('a0000000-0000-0000-0000-000000000002', 'Travel', 'India — spiritual journey',    '7 months backpacking in India seeking enlightenment; met Neem Karoli Baba followers; shaved head',    'range', 1974, 1974, '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000002', 'Travel', 'Japan — Zen & design pilgrimages', 'Multiple trips to Japan studying Zen Buddhism and Sony manufacturing; deeply influenced Apple''s aesthetic', 'range', 1982, 2000, '#0ea5e9'),
  -- Health
  ('a0000000-0000-0000-0000-000000000002', 'Health', 'Pancreatic cancer diagnosed',  'Rare pancreatic neuroendocrine tumour; initially tried alternative diet therapy for 9 months',          'point', 2003, null,  '#ef4444'),
  ('a0000000-0000-0000-0000-000000000002', 'Health', 'Surgery & medical leave',      'Underwent surgery; took first medical leave Jan 2009; liver transplant in Tennessee April 2009',        'range', 2009, 2009, '#ef4444'),
  ('a0000000-0000-0000-0000-000000000002', 'Health', 'Final medical leave & death',  'Second medical leave Jan 2011; resigned as CEO Aug 24 2011; died Oct 5 2011 aged 56',                  'range', 2011, 2011, '#ef4444'),
  -- Relationships
  ('a0000000-0000-0000-0000-000000000002', 'Relationships', 'Chrisann Brennan',       'On-and-off relationship from high school; mother of Lisa; Jobs initially denied paternity',            'range', 1972, 1978, '#ec4899'),
  ('a0000000-0000-0000-0000-000000000002', 'Relationships', 'Joan Baez',              'Brief relationship with folk singer; Jobs reportedly attracted partly due to her link to Bob Dylan',   'range', 1982, 1985, '#ec4899'),
  ('a0000000-0000-0000-0000-000000000002', 'Relationships', 'Laurene Powell Jobs',    'Met at Stanford Business School lecture; married Mar 18 1991; together until his death',              'range', 1989, 2011, '#ec4899'),
  -- Family
  ('a0000000-0000-0000-0000-000000000002', 'Family', 'Lisa Brennan-Jobs born',   'Daughter with Chrisann; Jobs denied paternity for years; eventually reconciled',                           'point', 1978, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000002', 'Family', 'Reed Jobs born',           'First child with Laurene; later graduated Stanford; became filmmaker',                                       'point', 1991, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000002', 'Family', 'Erin Siena Jobs born',     'Second child with Laurene; notably private life',                                                            'point', 1995, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000002', 'Family', 'Eve Jobs born',            'Third child with Laurene; became professional equestrian and model',                                         'point', 1998, null,  '#f97316'),
  -- Assets
  ('a0000000-0000-0000-0000-000000000002', 'Assets', 'Apple IPO',               'Apple went public Dec 1980; Jobs'' shares worth ~$256M at age 25 — then largest IPO since Ford',           'point', 1980, null,  '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000002', 'Assets', 'Pixar IPO',               'Pixar''s Toy Story IPO Nov 1995 made Jobs the largest individual shareholder; worth ~$1.2B overnight',    'point', 1995, null,  '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000002', 'Assets', 'Disney buys Pixar',       'Disney acquired Pixar for $7.4B in stock; Jobs became Disney''s largest single shareholder (~$4.4B)',     'point', 2006, null,  '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000002', 'Assets', 'Estate at death (~$11B)', 'Net worth estimated $10.2B at death; held primarily in Disney and Apple stock',                              'point', 2011, null,  '#14b8a6'),
  -- Vehicles
  ('a0000000-0000-0000-0000-000000000002', 'Vehicles', 'BMW 2002',              'Drove BMW 2002 in early Apple days; well-known car enthusiast from youth',                                    'range', 1975, 1985, '#64748b'),
  ('a0000000-0000-0000-0000-000000000002', 'Vehicles', 'Porsche 911 Turbo',     'Drove Porsche 911 during mid-career; matched his precision-design aesthetic',                                 'range', 1985, 2000, '#64748b'),
  ('a0000000-0000-0000-0000-000000000002', 'Vehicles', 'Mercedes-Benz SL55 AMG','Leased a new one every 6 months — California law gave 6-month grace before plates required; no plates ever', 'range', 2000, 2011, '#64748b'),
  -- Items
  ('a0000000-0000-0000-0000-000000000002', 'Items', 'Los Altos family garage',  'The Jobs family garage at 2066 Crist Dr where Apple was literally co-founded; now a historic landmark',   'range', 1976, 1976, '#6366f1'),
  ('a0000000-0000-0000-0000-000000000002', 'Items', 'Jackling House, Woodside', 'Bought 1980s Spanish-colonial mansion; famously left it nearly empty of furniture; demolished 2011',        'range', 1984, 2004, '#6366f1'),
  ('a0000000-0000-0000-0000-000000000002', 'Items', 'Palo Alto family home',    'Modest two-storey house on Waverley St; no fence; fans could and did walk up to the door',                 'range', 1991, 2011, '#6366f1'),
  ('a0000000-0000-0000-0000-000000000002', 'Items', 'Black Issey Miyake turtleneck', 'Ordered ~100 identical turtlenecks from Miyake; wore same outfit daily to eliminate decision fatigue', 'range', 1998, 2011, '#6366f1'),
  -- Achievements
  ('a0000000-0000-0000-0000-000000000002', 'Achievements', 'Apple II launch',         'First mass-market personal computer with colour graphics; launched consumer PC era',                   'point', 1977, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000002', 'Achievements', 'Macintosh launch',        '"The computer for the rest of us" introduced GUI and mouse to the mainstream; iconic 1984 ad',        'point', 1984, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000002', 'Achievements', 'Toy Story (Pixar)',       'World''s first fully computer-animated feature film; changed animation forever',                       'point', 1995, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000002', 'Achievements', 'iMac — Apple''s comeback','Translucent design iMac reversed Apple''s decline; "Think Different" era begins',                   'point', 1998, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000002', 'Achievements', 'iPod + iTunes Store',     '1,000 songs in your pocket; iTunes Store (2003) revolutionised the music industry',                   'range', 2001, 2003, '#eab308'),
  ('a0000000-0000-0000-0000-000000000002', 'Achievements', 'iPhone launch',           '"Every once in a while a revolutionary product comes along that changes everything" — Jan 9 2007',     'point', 2007, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000002', 'Achievements', 'App Store',              'Opened July 2008; created trillion-dollar app economy; transformed software distribution',              'point', 2008, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000002', 'Achievements', 'iPad launch',             'Defined the tablet category; sold 300,000 on launch day; surpassed all expectations',                 'point', 2010, null,  '#eab308');


-- ============================================================
-- ALBERT EINSTEIN  (born 14 Mar 1879, died 18 Apr 1955)
-- ============================================================
INSERT INTO public.personas (id, name, bio, birth_year, death_year) VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'Albert Einstein',
  'German-born theoretical physicist. Developed the Special and General Theories of Relativity, the famous equation E=mc², and the photoelectric effect (Nobel Prize 1921). Emigrated to the USA in 1933 to escape Nazi Germany. Considered the most influential physicist of the 20th century.',
  1879, 1955
);

INSERT INTO public.persona_events (persona_id, lane_name, title, description, type, start_year, end_year, color) VALUES
  -- Locations
  ('a0000000-0000-0000-0000-000000000003', 'Locations', 'Ulm, Kingdom of Württemberg',  'Born 14 March 1879; family moved to Munich when he was one year old',                                 'point', 1879, null,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000003', 'Locations', 'Munich, Germany',              'Childhood and schooling; father ran electrical engineering company',                                    'range', 1880, 1894, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000003', 'Locations', 'Milan, Italy',                 'Family relocated; Einstein left gymnasium and joined them; brief Italian idyll',                       'range', 1894, 1895, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000003', 'Locations', 'Aarau, Switzerland',           'Cantonal school to complete Matura (Swiss high school diploma)',                                       'range', 1895, 1896, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000003', 'Locations', 'Zurich & Bern, Switzerland',   'ETH studies then Swiss patent clerk; wrote Annus Mirabilis papers in Bern apartment',                 'range', 1896, 1914, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000003', 'Locations', 'Berlin, Germany',              'Member of Prussian Academy of Sciences; director Kaiser Wilhelm Institute; fame grew after 1919',     'range', 1914, 1933, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000003', 'Locations', 'Princeton, NJ, USA',           'Fled Nazi Germany; joined IAS; lived at 112 Mercer Street until his death; became US citizen 1940',  'range', 1933, 1955, '#3b82f6'),
  -- Education
  ('a0000000-0000-0000-0000-000000000003', 'Education', 'Luitpold Gymnasium, Munich',   'Catholic school despite being Jewish; famously clashed with rote-learning teaching style',            'range', 1888, 1894, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000003', 'Education', 'Cantonal School, Aarau',       'Progressive Swiss school he loved; produced first thought experiment (chasing a light beam)',         'range', 1895, 1896, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000003', 'Education', 'ETH Zurich — Physics & Maths', 'Teaching diploma in maths and physics; graduated 1900; failed to get assistant position afterwards',  'range', 1896, 1900, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000003', 'Education', 'PhD — University of Zurich',   'Completed doctorate while working at patent office; thesis on molecular dimensions; 1905',           'range', 1901, 1905, '#8b5cf6'),
  -- Work
  ('a0000000-0000-0000-0000-000000000003', 'Work', 'Swiss Patent Office, Bern',         'Technical expert 3rd class reviewing electromagnetic patents; gave him freedom to think',              'range', 1902, 1909, '#10b981'),
  ('a0000000-0000-0000-0000-000000000003', 'Work', 'University of Zurich',              'First academic post — associate professor of theoretical physics',                                     'range', 1909, 1911, '#10b981'),
  ('a0000000-0000-0000-0000-000000000003', 'Work', 'German University Prague',          'Full professor; Czech interlude; developed key ideas toward General Relativity',                       'range', 1911, 1912, '#10b981'),
  ('a0000000-0000-0000-0000-000000000003', 'Work', 'ETH Zurich (professor)',             'Returned as full professor; old alma mater; continued General Relativity work',                       'range', 1912, 1914, '#10b981'),
  ('a0000000-0000-0000-0000-000000000003', 'Work', 'Prussian Academy / Kaiser Wilhelm', 'Most prestigious scientific post in Germany; published General Relativity 1915',                      'range', 1914, 1933, '#059669'),
  ('a0000000-0000-0000-0000-000000000003', 'Work', 'IAS Princeton',                     'Institute for Advanced Study; pursued unified field theory until death; never succeeded',              'range', 1933, 1955, '#10b981'),
  -- Travel
  ('a0000000-0000-0000-0000-000000000003', 'Travel', 'USA — first lecture tour',        'Visited New York and Princeton; received telegram about Nobel Prize during the voyage; global celebrity', 'range', 1921, 1921, '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000003', 'Travel', 'Japan, Palestine & Spain',        'Extended lecture tour 1922–23; spoke to thousands in Japan; visited Palestine (future Israel)',       'range', 1922, 1923, '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000003', 'Travel', 'USA — Caltech visits',            'Visiting professor at Caltech Pasadena 1930–31 and 1931–32; last time he saw Europe',                'range', 1930, 1932, '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000003', 'Travel', 'Permanent exile from Europe',     'Left Germany Jan 1933; never returned; Nazis seized his property and revoked citizenship',            'point', 1933, null,  '#0ea5e9'),
  -- Health
  ('a0000000-0000-0000-0000-000000000003', 'Health', 'Collapse from overwork',          'Suffered serious collapse 1928; bedridden for months; Elsa cared for him during recovery',            'range', 1928, 1929, '#ef4444'),
  ('a0000000-0000-0000-0000-000000000003', 'Health', 'Aortic aneurysm surgery',         'Abdominal aortic aneurysm repaired surgically; doctors advised rest he largely ignored',              'point', 1948, null,  '#ef4444'),
  ('a0000000-0000-0000-0000-000000000003', 'Health', 'Death — refused surgery',         'Aneurysm ruptured April 17 1955; refused surgery ("tasteless to prolong life artificially"); died April 18', 'point', 1955, null, '#ef4444'),
  -- Relationships
  ('a0000000-0000-0000-0000-000000000003', 'Relationships', 'Mileva Marić',             'Serbian physicist; met at ETH; married Jan 1903; collaborated on early work; divorced Feb 1919',     'range', 1896, 1919, '#ec4899'),
  ('a0000000-0000-0000-0000-000000000003', 'Relationships', 'Elsa Löwenthal Einstein', 'First cousin; began relationship while still married; wed Jun 1919; she died Dec 1936',               'range', 1912, 1936, '#ec4899'),
  -- Family
  ('a0000000-0000-0000-0000-000000000003', 'Family', 'Lieserl (fate unknown)',          'Born Jan 1902 before marriage; given up for adoption or died of scarlet fever — records unclear',     'point', 1902, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000003', 'Family', 'Hans Albert born',               'First son; became professor of hydraulic engineering at UC Berkeley; survived his father',             'point', 1904, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000003', 'Family', 'Eduard "Tete" born',             'Second son; musically gifted pianist; diagnosed with schizophrenia; institutionalised in Zurich',     'point', 1910, null,  '#f97316'),
  -- Assets
  ('a0000000-0000-0000-0000-000000000003', 'Assets', 'Nobel Prize money ($32,000)',     'Awarded Nobel 1921; entire prize given to ex-wife Mileva per their 1919 divorce agreement',          'point', 1922, null,  '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000003', 'Assets', 'IAS salary ($16,000/yr)',         'Princeton IAS offered whatever he wanted; he requested $3,000; they paid $16,000',                   'range', 1933, 1955, '#14b8a6'),
  -- Vehicles
  ('a0000000-0000-0000-0000-000000000003', 'Vehicles', 'Never learned to drive',        'Famously walked or took taxis everywhere; said driving required too much attention for thinking',      'range', 1879, 1955, '#64748b'),
  ('a0000000-0000-0000-0000-000000000003', 'Vehicles', 'Sailboat "Tümmler"',            'Passionate sailor on Swiss lakes and Long Island Sound; sailed despite being unable to swim',          'range', 1896, 1954, '#64748b'),
  -- Items
  ('a0000000-0000-0000-0000-000000000003', 'Items', 'Bern apartment (Kramgasse 49)', 'Rented flat where he wrote all four 1905 Annus Mirabilis papers; now a museum',                         'range', 1903, 1909, '#6366f1'),
  ('a0000000-0000-0000-0000-000000000003', 'Items', '112 Mercer Street, Princeton',  'Modest rented house; lived there 1935–1955; cluttered study; now IAS guesthouse',                       'range', 1935, 1955, '#6366f1'),
  ('a0000000-0000-0000-0000-000000000003', 'Items', 'Violin ("Lina")',               'Played violin throughout his life; called it "Lina"; preferred Mozart; used music to think',            'range', 1884, 1955, '#6366f1'),
  -- Achievements
  ('a0000000-0000-0000-0000-000000000003', 'Achievements', 'Annus Mirabilis — 4 papers','1905: Brownian motion, photoelectric effect, Special Relativity, E=mc² — all in one year aged 26',  'point', 1905, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000003', 'Achievements', 'General Theory of Relativity','Completed Nov 1915; fundamentally replaced Newton''s law of gravity; still the framework used today', 'point', 1915, null, '#eab308'),
  ('a0000000-0000-0000-0000-000000000003', 'Achievements', 'Light deflection confirmed', 'Eddington''s 1919 solar eclipse measured light bending; Einstein became global celebrity overnight', 'point', 1919, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000003', 'Achievements', 'Nobel Prize in Physics',    'Awarded 1921 for photoelectric effect; delivered 1922; relativity still considered "controversial"', 'point', 1921, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000003', 'Achievements', 'Einstein–Szilard letter',   'Warned Roosevelt that Germany might build atomic bomb; triggered Manhattan Project',                 'point', 1939, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000003', 'Achievements', 'US citizenship',            'Became US citizen 1 October 1940; kept Swiss citizenship alongside it',                               'point', 1940, null,  '#eab308');


-- ============================================================
-- MARIE CURIE  (born 7 Nov 1867, died 4 Jul 1934)
-- ============================================================
INSERT INTO public.personas (id, name, bio, birth_year, death_year) VALUES (
  'a0000000-0000-0000-0000-000000000004',
  'Marie Curie',
  'Polish-French physicist and chemist. Pioneered research on radioactivity; discovered polonium and radium. First woman to win a Nobel Prize (Physics, 1903), and the first person to win two Nobel Prizes (Chemistry, 1911). First female professor at the University of Paris. Died 1934 of aplastic anaemia caused by radiation exposure.',
  1867, 1934
);

INSERT INTO public.persona_events (persona_id, lane_name, title, description, type, start_year, end_year, color) VALUES
  -- Locations
  ('a0000000-0000-0000-0000-000000000004', 'Locations', 'Warsaw, Congress Poland',      'Born Maria Skłodowska; under Russian partition; father a physics and maths teacher',                  'range', 1867, 1891, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000004', 'Locations', 'Paris, France',                'Moved to study at Sorbonne; stayed for the rest of her life; became French citizen',                  'range', 1891, 1934, '#3b82f6'),
  -- Education
  ('a0000000-0000-0000-0000-000000000004', 'Education', '"Flying University" Warsaw',   'Secret underground university (illegal under Russian rule); studied natural sciences and sociology',  'range', 1882, 1891, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000004', 'Education', 'Sorbonne — Physics licence',  'First woman to earn physics licence from University of Paris; graduated first in her class 1893',     'range', 1891, 1893, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000004', 'Education', 'Sorbonne — Mathematics licence','Second degree: ranked second in her class 1894; met Pierre Curie same year',                        'range', 1893, 1894, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000004', 'Education', 'Doctorate in Physics',        'First woman in France to earn a physics PhD; thesis on radioactive substances; 1903',                 'range', 1897, 1903, '#8b5cf6'),
  -- Work
  ('a0000000-0000-0000-0000-000000000004', 'Work', 'Radioactivity research',           'Coined term "radioactivity"; discovered polonium & radium; worked in leaky, barely-heated shed',      'range', 1897, 1906, '#10b981'),
  ('a0000000-0000-0000-0000-000000000004', 'Work', 'Professor at Sorbonne',            'Succeeded Pierre after his death 1906; first female professor in Sorbonne''s 661-year history',       'range', 1906, 1934, '#10b981'),
  ('a0000000-0000-0000-0000-000000000004', 'Work', 'Radium Institute (Institut Curie)','Founded and directed; split into Curie Laboratory (physics) and Pasteur Laboratory (medicine)',       'range', 1914, 1934, '#059669'),
  ('a0000000-0000-0000-0000-000000000004', 'Work', 'Petites Curies — WWI X-ray units','Organised 20 mobile X-ray vehicles and 200 fixed units; personally drove and operated them at front', 'range', 1914, 1918, '#047857'),
  -- Travel
  ('a0000000-0000-0000-0000-000000000004', 'Travel', 'USA tour — radium gift',         'Invited by US women; met President Harding; received 1g of radium worth $100k; massive reception',   'range', 1921, 1921, '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000004', 'Travel', 'Poland — Radium Institute Warsaw','Returned to open Warsaw Radium Institute; emotional homecoming; greeted as national hero',          'range', 1925, 1925, '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000004', 'Travel', 'USA — second fundraising tour',  'Raised funds for Warsaw institute; received second gram of radium from President Hoover',             'range', 1929, 1929, '#0ea5e9'),
  -- Health
  ('a0000000-0000-0000-0000-000000000004', 'Health', 'Radiation sickness (chronic)',   'Fingers cracked and scarred from handling radioactive materials; carried test tubes in pockets',      'range', 1900, 1934, '#ef4444'),
  ('a0000000-0000-0000-0000-000000000004', 'Health', 'Cataracts from radiation',       'Nearly blind in final years; underwent four eye operations; wore tinted lenses',                       'range', 1920, 1930, '#ef4444'),
  ('a0000000-0000-0000-0000-000000000004', 'Health', 'Aplastic anaemia — death',       'Died July 4 1934 from aplastic anaemia; bone marrow failed from decades of radiation exposure',       'point', 1934, null,  '#ef4444'),
  -- Relationships
  ('a0000000-0000-0000-0000-000000000004', 'Relationships', 'Pierre Curie',            'Met 1894; married Jul 1895; true scientific partnership; Pierre died in road accident Apr 1906',      'range', 1894, 1906, '#ec4899'),
  ('a0000000-0000-0000-0000-000000000004', 'Relationships', 'Paul Langevin (affair)',   'Relationship with married physicist Langevin; leaked 1911; huge scandal; nearly denied 2nd Nobel',  'range', 1910, 1912, '#ec4899'),
  -- Family
  ('a0000000-0000-0000-0000-000000000004', 'Family', 'Irène born',                     'Irène Joliot-Curie; assisted WWI X-ray units aged 17; won Nobel Prize in Chemistry 1935',            'point', 1897, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000004', 'Family', 'Ève born',                       'Ève Curie; author of famous biography "Madame Curie"; her husband Henry Labouisse accepted Nobel Peace Prize (UNICEF) 1965', 'point', 1904, null, '#f97316'),
  ('a0000000-0000-0000-0000-000000000004', 'Family', 'Pierre killed in accident',      'Pierre slipped under horse-drawn wagon in Paris rain; skull crushed; Marie devastated; took over his post', 'point', 1906, null, '#f97316'),
  -- Assets
  ('a0000000-0000-0000-0000-000000000004', 'Assets', 'Nobel Prize Physics (shared)',   'Prize shared with Pierre and Henri Becquerel; first woman Nobel laureate in any field',               'point', 1903, null,  '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000004', 'Assets', 'Nobel Prize Chemistry (solo)',   'Second Nobel Prize awarded solely to her; only person (to date) to win in two different sciences',   'point', 1911, null,  '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000004', 'Assets', 'Refused to patent radium',       'Deliberately chose not to patent radium isolation process; "radium belongs to the world"',           'point', 1898, null,  '#14b8a6'),
  -- Vehicles
  ('a0000000-0000-0000-0000-000000000004', 'Vehicles', 'Learned to drive (age ~47)',    'Took driving lessons specifically to operate Petites Curies mobile X-ray vans during WWI',           'point', 1914, null,  '#64748b'),
  ('a0000000-0000-0000-0000-000000000004', 'Vehicles', 'Petites Curies X-ray vans',    'Personally drove and operated 20 mobile radiography vehicles at Western Front; X-rayed 1M+ soldiers','range', 1914, 1918, '#64748b'),
  -- Items
  ('a0000000-0000-0000-0000-000000000004', 'Items', 'Laboratory notebooks',            'Her personal notebooks are still so radioactive they''re kept in lead-lined boxes at Bibliothèque Nationale; visitors must sign liability waiver', 'range', 1897, 1934, '#6366f1'),
  ('a0000000-0000-0000-0000-000000000004', 'Items', '1 gram of radium (USA gift)',      'Received from President Harding 1921; worth ~$100k; most valuable gift she ever received',          'point', 1921, null,  '#6366f1'),
  -- Achievements
  ('a0000000-0000-0000-0000-000000000004', 'Achievements', 'Discovery of Polonium',          'Named after her homeland Poland (then under Russian rule) — a political act as much as scientific','point', 1898, null, '#eab308'),
  ('a0000000-0000-0000-0000-000000000004', 'Achievements', 'Discovery of Radium',            'Isolated radium after processing tonnes of pitchblende in their leaky shed over 4 years',        'point', 1898, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000004', 'Achievements', 'Nobel Prize — Physics',          'First woman to win a Nobel Prize in any field; recognition of radioactivity research',           'point', 1903, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000004', 'Achievements', 'First female Sorbonne professor','Appointed to Pierre''s chair 1906; first woman professor in 661 years of Sorbonne history',     'point', 1906, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000004', 'Achievements', 'Nobel Prize — Chemistry',        'Only person ever to win Nobel Prizes in two different scientific disciplines',                    'point', 1911, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000004', 'Achievements', 'Mobile X-ray units (WWI)',       'Created 20 Petites Curies; trained 150 women operators; over 1 million soldiers examined',      'range', 1914, 1918, '#eab308');


-- ============================================================
-- LEONARDO DA VINCI  (born 15 Apr 1452, died 2 May 1519)
-- ============================================================
INSERT INTO public.personas (id, name, bio, birth_year, death_year) VALUES (
  'a0000000-0000-0000-0000-000000000005',
  'Leonardo da Vinci',
  'Italian Renaissance polymath: painter, sculptor, architect, musician, mathematician, engineer, inventor, anatomist, geologist, botanist, and writer. Widely considered one of the greatest geniuses who ever lived. His most famous works include the Mona Lisa and The Last Supper.',
  1452, 1519
);

INSERT INTO public.persona_events (persona_id, lane_name, title, description, type, start_year, end_year, color) VALUES
  -- Locations
  ('a0000000-0000-0000-0000-000000000005', 'Locations', 'Anchiano, near Vinci',         'Born illegitimate son of notary Piero da Vinci and peasant Caterina; raised in Vinci village',      'range', 1452, 1466, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000005', 'Locations', 'Florence',                     'Apprenticed to Verrocchio; established as independent master; joined painters'' guild 1472',          'range', 1466, 1482, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000005', 'Locations', 'Milan',                        'Court of Ludovico Sforza "Il Moro"; most productive period; engineer, artist, entertainer',          'range', 1482, 1499, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000005', 'Locations', 'Venice & Mantua',              'Fled French invasion of Milan; briefly worked for Isabella d''Este; consulted on defences',         'range', 1499, 1500, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000005', 'Locations', 'Florence (return)',            'Painted Mona Lisa; Battle of Anghiari fresco; anatomical dissections; rivalry with Michelangelo',   'range', 1500, 1508, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000005', 'Locations', 'Rome',                         'Under patronage of Giuliano de'' Medici at Vatican; dissection access; last Italian years',         'range', 1513, 1516, '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000005', 'Locations', 'Amboise, France',              'Invited by King Francis I; lived at Château du Clos Lucé; died there May 2 1519',                   'range', 1516, 1519, '#3b82f6'),
  -- Education
  ('a0000000-0000-0000-0000-000000000005', 'Education', 'Verrocchio''s bottega, Florence','Apprenticed to Andrea del Verrocchio; learned painting, sculpture, engineering, metallurgy',      'range', 1466, 1478, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000005', 'Education', 'Self-directed learning',       'Never attended university; taught himself Latin aged 40; voracious reader; kept 13,000+ pages of notes','range', 1478, 1519, '#8b5cf6'),
  -- Work
  ('a0000000-0000-0000-0000-000000000005', 'Work', 'Apprentice — Verrocchio',           'Helped paint "The Baptism of Christ"; so surpassed master that Verrocchio reportedly quit painting',  'range', 1466, 1478, '#10b981'),
  ('a0000000-0000-0000-0000-000000000005', 'Work', 'Independent master, Florence',      'Established own studio; received first independent commissions; left for Milan without completing them','range', 1478, 1482, '#10b981'),
  ('a0000000-0000-0000-0000-000000000005', 'Work', 'Court of Sforza, Milan',            'Military engineer, architect, sculptor, pageant designer, musician; completed The Last Supper',      'range', 1482, 1499, '#059669'),
  ('a0000000-0000-0000-0000-000000000005', 'Work', 'Military engineer — Cesare Borgia', 'Hired as chief military architect; mapped and surveyed Romagna region; created accurate maps',       'range', 1502, 1503, '#047857'),
  ('a0000000-0000-0000-0000-000000000005', 'Work', 'Anatomist & artist, Florence/Milan','Dissected 30+ human cadavers; produced unprecedented anatomical drawings',                           'range', 1489, 1513, '#10b981'),
  ('a0000000-0000-0000-0000-000000000005', 'Work', 'Premier Painter — King Francis I',  'Royal pension; no duties required; Francis called him "a very great philosopher"; died in his arms', 'range', 1516, 1519, '#10b981'),
  -- Travel
  ('a0000000-0000-0000-0000-000000000005', 'Travel', 'Florence to Milan',               'Left for Milan c.1482; reportedly sent Sforza a letter listing his abilities as military engineer first', 'point', 1482, null, '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000005', 'Travel', 'Flight from French invasion',     'Milan fell to Louis XII of France 1499; Leonardo fled to Venice via Mantua with Luca Pacioli',      'point', 1499, null,  '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000005', 'Travel', 'Surveying mission — Romagna',     'Rode hundreds of miles across central Italy mapping towns for Cesare Borgia; met Machiavelli',       'range', 1502, 1503, '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000005', 'Travel', 'Italy to France (final journey)', 'Crossed Alps aged 64 by mule; accompanied by Melzi and Salaì; settled at Clos Lucé near Amboise',   'point', 1516, null,  '#0ea5e9'),
  -- Health
  ('a0000000-0000-0000-0000-000000000005', 'Health', 'Right hand stroke (~1517)',        'Visitor Antonio de Beatis noted right hand partly paralysed; continued to draw left-handed',         'point', 1517, null,  '#ef4444'),
  ('a0000000-0000-0000-0000-000000000005', 'Health', 'Final illness and death',          'Declined rapidly spring 1519; died May 2 at Clos Lucé aged 67; Francis I reportedly held him',      'range', 1519, 1519, '#ef4444'),
  -- Relationships
  ('a0000000-0000-0000-0000-000000000005', 'Relationships', 'Gian Giacomo Caprotti "Salaì"','Troublesome but beloved pupil and companion for 30 years; named him heir to half his Italian estate','range', 1490, 1519, '#ec4899'),
  ('a0000000-0000-0000-0000-000000000005', 'Relationships', 'Francesco Melzi',          'Aristocratic pupil from Milan; utterly devoted companion; inherited notebooks and unpublished works', 'range', 1506, 1519, '#ec4899'),
  -- Family
  ('a0000000-0000-0000-0000-000000000005', 'Family', 'Born illegitimate',               'Illegitimate son of ser Piero da Vinci (notary) and Caterina (peasant); raised in Vinci household',  'point', 1452, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000005', 'Family', 'Raised in father''s home',        'Taken in by father''s family aged ~5; educated alongside legitimate half-siblings eventually',        'range', 1457, 1466, '#f97316'),
  ('a0000000-0000-0000-0000-000000000005', 'Family', 'Never married; no known children','Spent life with devoted pupils/companions; left no direct heirs',                                    'range', 1452, 1519, '#f97316'),
  -- Assets
  ('a0000000-0000-0000-0000-000000000005', 'Assets', 'Sforza court salary',             'Regular stipend from Duke Ludovico Sforza for 17 years; plus board, studio, assistants',            'range', 1482, 1499, '#14b8a6'),
  ('a0000000-0000-0000-0000-000000000005', 'Assets', 'French royal pension',            'King Francis I gave annual pension of 1,000 écus plus Clos Lucé manor house to live in',            'range', 1516, 1519, '#14b8a6'),
  -- Vehicles
  ('a0000000-0000-0000-0000-000000000005', 'Vehicles', 'Self-propelled cart design',    'Spring-powered programmable cart in Codex Atlanticus c.1478; considered world''s first robot vehicle design; working model built 2004', 'point', 1478, null, '#64748b'),
  ('a0000000-0000-0000-0000-000000000005', 'Vehicles', 'Armoured vehicle ("tank")',     'Designed circular armoured vehicle with cannons on all sides; 1487; 500 years before tanks existed',  'point', 1487, null, '#64748b'),
  ('a0000000-0000-0000-0000-000000000005', 'Vehicles', 'Aerial screw (helicopter precursor)','Large helical screw design meant to compress air and rise; c.1489; concept sound, materials weren''t','point', 1489, null, '#64748b'),
  ('a0000000-0000-0000-0000-000000000005', 'Vehicles', 'Ornithopter (flying machine)',  'Human-powered wing-flapping aircraft; detailed engineering drawings; inspired by birds and bats',    'range', 1488, 1505, '#64748b'),
  -- Items
  ('a0000000-0000-0000-0000-000000000005', 'Items', 'Codex Atlanticus (Milan, 1,119 pp)', 'Largest collection of his drawings and writings; compiled posthumously; held at Biblioteca Ambrosiana', 'range', 1478, 1519, '#6366f1'),
  ('a0000000-0000-0000-0000-000000000005', 'Items', 'Codex Leicester',                  'Scientific notebook on water, geology, Moon; ~72 pages; bought by Bill Gates 1994 for $30.8M',       'range', 1504, 1513, '#6366f1'),
  ('a0000000-0000-0000-0000-000000000005', 'Items', 'Silver lyre (self-made)',          'Crafted silver lyre shaped like a horse skull; played as first "gift" to Sforza court in Milan',      'point', 1482, null,  '#6366f1'),
  ('a0000000-0000-0000-0000-000000000005', 'Items', '~13,000 notebook pages (surviving)','Estimated 30,000+ pages written; ~13,000 survive; cover anatomy, painting, engineering, philosophy', 'range', 1478, 1519, '#6366f1'),
  -- Achievements
  ('a0000000-0000-0000-0000-000000000005', 'Achievements', 'Vitruvian Man',             'Perfect study of human proportions; among most recognisable images in the world; c.1490',           'point', 1490, null,  '#eab308'),
  ('a0000000-0000-0000-0000-000000000005', 'Achievements', 'The Last Supper',           'Tempera mural at Santa Maria delle Grazie, Milan; revolutionary composition; 1495–1498',            'range', 1495, 1498, '#eab308'),
  ('a0000000-0000-0000-0000-000000000005', 'Achievements', 'Human anatomy illustrations','Dissected 30+ cadavers; produced most accurate anatomical drawings ever made; centuries ahead of time', 'range', 1489, 1513, '#eab308'),
  ('a0000000-0000-0000-0000-000000000005', 'Achievements', 'Mona Lisa',                 'Begun ~1503; considered world''s most famous painting; now in Louvre; worked on it until he died',   'range', 1503, 1519, '#eab308'),
  ('a0000000-0000-0000-0000-000000000005', 'Achievements', 'Hydrological engineering designs','Canal and water management plans for Milan and Florence; some built; centuries ahead of practice', 'range', 1482, 1509, '#eab308'),
  ('a0000000-0000-0000-0000-000000000005', 'Achievements', 'St John the Baptist',       'Final painting; mystical sfumato; bequeathed to Francesco Melzi; now in the Louvre',                'range', 1513, 1516, '#eab308');
