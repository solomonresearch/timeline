-- ============================================================
-- 023_personas_merkel_swift_ronaldo.sql
-- Add Angela Merkel, Taylor Swift, Cristiano Ronaldo
-- ============================================================

-- ============================================================
-- ANGELA MERKEL  (born 17 Jul 1954)
-- ============================================================
INSERT INTO public.personas (id, name, bio, birth_year, death_year) VALUES (
  'a0000000-0000-0000-0000-000000000006',
  'Angela Merkel',
  'German politician and scientist. Chancellor of Germany 2005–2021 — the longest-serving head of government in the EU. Born in Hamburg; grew up in East Germany. Holds a doctorate in quantum chemistry. First woman to serve as German Chancellor; shaped European policy through the eurozone crisis, refugee crisis, and Brexit negotiations.',
  1954, null
);

INSERT INTO public.persona_events (persona_id, lane_name, title, description, type, start_year, end_year, color) VALUES
  -- Locations
  ('a0000000-0000-0000-0000-000000000006', 'Locations', 'Hamburg, West Germany',       'Born in Hamburg; family moved to East Germany when father took a pastor position in Templin',         'range', 1954, 1957,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000006', 'Locations', 'Templin, East Germany',        'Grew up in Templin, Brandenburg; father was a Lutheran pastor in the GDR',                              'range', 1957, 1973,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000006', 'Locations', 'Leipzig, East Germany',        'Studied physics at Karl Marx University Leipzig; later doctoral research at the Academy of Sciences',   'range', 1973, 1990,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000006', 'Locations', 'Berlin, Germany',              'Moved to Berlin after reunification; home base for her entire political career as Chancellor',          'range', 1990, 2026,  '#3b82f6'),
  -- Education
  ('a0000000-0000-0000-0000-000000000006', 'Education', 'Erweiterte Oberschule Templin','Secondary school in Templin; excelled in mathematics, Russian and sciences; won national Olympiads',  'range', 1961, 1973,  '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000006', 'Education', 'Karl Marx University Leipzig', 'Studied physics 1973–1978; interested in theoretical chemistry; active in student communist youth league', 'range', 1973, 1978, '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000006', 'Education', 'PhD in Quantum Chemistry',     'Doctorate from Academy of Sciences Berlin; thesis on the decay rates of hydrocarbons; awarded 1986',   'range', 1978, 1986,  '#8b5cf6'),
  -- Work
  ('a0000000-0000-0000-0000-000000000006', 'Work', 'Researcher — Academy of Sciences', 'Physical chemist at the Central Institute for Physical Chemistry, East Berlin; published papers',        'range', 1978, 1989,  '#10b981'),
  ('a0000000-0000-0000-0000-000000000006', 'Work', 'CDU Politician',                   'Joined CDU after the Wall fell; elected to Bundestag 1990; mentored by Chancellor Helmut Kohl',         'range', 1990, 2021,  '#059669'),
  ('a0000000-0000-0000-0000-000000000006', 'Work', 'Federal Minister for Women',       'Minister for Women and Youth under Chancellor Kohl 1991–1994',                                           'range', 1991, 1994,  '#047857'),
  ('a0000000-0000-0000-0000-000000000006', 'Work', 'Federal Minister for Environment', 'Minister for the Environment under Chancellor Kohl 1994–1998; led Germany''s climate commitments',       'range', 1994, 1998,  '#047857'),
  ('a0000000-0000-0000-0000-000000000006', 'Work', 'CDU Party Leader',                 'Elected CDU party chairwoman Dec 2000; first woman to lead the CDU',                                    'range', 2000, 2018,  '#10b981'),
  ('a0000000-0000-0000-0000-000000000006', 'Work', 'Chancellor of Germany',            'Led four consecutive coalition governments; navigated financial crisis, refugee crisis, and COVID-19',   'range', 2005, 2021,  '#059669'),
  -- Travel
  ('a0000000-0000-0000-0000-000000000006', 'Travel', 'First visit to West Germany',    'First crossed the border to the West at age 35 when the Wall fell in November 1989',                    'point', 1989, null,  '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000006', 'Travel', 'G8 / G20 summits (annual)',      'Represented Germany at global summits throughout her chancellorship; known for strong multilateralism',  'range', 2005, 2021,  '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000006', 'Travel', 'China diplomatic visits',        'Multiple visits to Beijing; built strong Germany–China trade relationship; more than any other Chancellor', 'range', 2006, 2021, '#0ea5e9'),
  -- Health
  ('a0000000-0000-0000-0000-000000000006', 'Health', 'Trembling episodes',             'Suffered visible trembling episodes at public ceremonies from 2019; attributed to dehydration; later retired', 'range', 2019, 2021, '#ef4444'),
  -- Relationships
  ('a0000000-0000-0000-0000-000000000006', 'Relationships', 'Ulrich Merkel (divorced)', 'First husband; fellow physics student; married 1977; divorced 1982; she kept his surname',              'range', 1977, 1982,  '#ec4899'),
  ('a0000000-0000-0000-0000-000000000006', 'Relationships', 'Joachim Sauer',            'Quantum chemist at Humboldt University Berlin; married 1998; guards privacy intensely',                 'range', 1998, 2026,  '#ec4899'),
  -- Achievements
  ('a0000000-0000-0000-0000-000000000006', 'Achievements', 'First female Chancellor',  'Became Germany''s first female Chancellor on 22 November 2005; formed grand coalition with SPD',        'point', 2005, null,  '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000006', 'Achievements', 'Forbes Most Powerful Woman','Named Forbes'' most powerful woman in the world for a record 10 consecutive years (2006–2016)',         'range', 2006, 2016,  '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000006', 'Achievements', 'Managed Eurozone Crisis',  'Led EU response to Greek sovereign debt crisis; insisted on austerity measures; kept eurozone intact',  'range', 2010, 2012,  '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000006', 'Achievements', '"Wir schaffen das"',        'Welcomed over 1 million refugees during 2015 Syrian crisis with her famous phrase; highly controversial', 'point', 2015, null, '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000006', 'Achievements', 'Longest-serving EU leader', 'Retired Nov 2021 after 16 years as Chancellor — longest-serving democratically elected EU head of govt', 'point', 2021, null, '#f59e0b');

-- ============================================================
-- TAYLOR SWIFT  (born 13 Dec 1989)
-- ============================================================
INSERT INTO public.personas (id, name, bio, birth_year, death_year) VALUES (
  'a0000000-0000-0000-0000-000000000007',
  'Taylor Swift',
  'American singer-songwriter. One of the best-selling music artists of all time, with over 200 million records sold. Born in West Reading, Pennsylvania; moved to Nashville aged 14 to pursue a country music career. Known for confessional songwriting, strategic album re-recordings, and the record-breaking Eras Tour (2023–2024).',
  1989, null
);

INSERT INTO public.persona_events (persona_id, lane_name, title, description, type, start_year, end_year, color) VALUES
  -- Locations
  ('a0000000-0000-0000-0000-000000000007', 'Locations', 'West Reading, Pennsylvania',   'Born and raised in West Reading; grew up on a Christmas tree farm; took acting and vocal lessons',   'range', 1989, 2004,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000007', 'Locations', 'Hendersonville, Tennessee',    'Family relocated to Hendersonville suburb of Nashville so Taylor could pursue country music career',   'range', 2004, 2011,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000007', 'Locations', 'Nashville, Tennessee',         'Moved to her own home in Nashville; the base of her music career and recording operations',            'range', 2011, 2026,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000007', 'Locations', 'New York City, NY',            'Moved to Tribeca, Manhattan in 2014; became core part of NYC social scene and culture',                'range', 2014, 2026,  '#3b82f6'),
  -- Education
  ('a0000000-0000-0000-0000-000000000007', 'Education', 'Hendersonville High School',   'Enrolled briefly; transferred to Aaron Academy homeschool to fit touring schedule',                    'range', 2004, 2008,  '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000007', 'Education', 'Aaron Academy (homeschool)',   'Completed high school credits via homeschooling while pursuing professional music career on the road',  'range', 2005, 2008,  '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000007', 'Education', 'NYU Honorary Doctorate',       'Received honorary doctorate in Fine Arts from New York University; delivered commencement speech',     'point', 2022, null,  '#8b5cf6'),
  -- Work
  ('a0000000-0000-0000-0000-000000000007', 'Work', 'Big Machine Records (signed)',      'Signed to Big Machine Records at 14; youngest artist ever signed to the label',                        'range', 2005, 2019,  '#10b981'),
  ('a0000000-0000-0000-0000-000000000007', 'Work', 'Taylor Swift (debut album)',        'Self-titled debut country album; wrote all songs; hit singles "Tim McGraw" and "Teardrops on My Guitar"', 'range', 2006, 2008, '#059669'),
  ('a0000000-0000-0000-0000-000000000007', 'Work', 'Fearless era',                     'Second album; Grammy Album of the Year; "Love Story" and "You Belong With Me" became global anthems',  'range', 2008, 2010,  '#10b981'),
  ('a0000000-0000-0000-0000-000000000007', 'Work', 'Speak Now era',                    'Third album; entirely self-written; world tour; 5× Platinum in the US',                                'range', 2010, 2012,  '#059669'),
  ('a0000000-0000-0000-0000-000000000007', 'Work', 'Red era',                          'Genre-blending fourth album; "We Are Never Getting Back Together" became her first #1 Hot 100 hit',   'range', 2012, 2014,  '#10b981'),
  ('a0000000-0000-0000-0000-000000000007', 'Work', '1989 era — full pop crossover',    'Fifth album; three #1 hits; Grammy Album of the Year; became biggest pop star of the decade',         'range', 2014, 2016,  '#059669'),
  ('a0000000-0000-0000-0000-000000000007', 'Work', 'Reputation era',                   'Darker sixth album; Reputation Stadium Tour grossed $345M — record at the time',                      'range', 2017, 2019,  '#10b981'),
  ('a0000000-0000-0000-0000-000000000007', 'Work', 'Republic Records & re-recordings', 'Signed with Republic/Universal; began re-recording her first six albums after catalogue sold without her consent', 'range', 2019, 2026, '#047857'),
  ('a0000000-0000-0000-0000-000000000007', 'Work', 'Lover / Folklore / Evermore era',  'Three acclaimed albums in 18 months; Folklore won Grammy Album of the Year; critically her best work', 'range', 2019, 2022, '#10b981'),
  ('a0000000-0000-0000-0000-000000000007', 'Work', 'Midnights / Eras Tour',            'Tenth album shattered streaming records; Eras Tour became the first concert tour to gross over $1B',  'range', 2022, 2025,  '#059669'),
  -- Travel
  ('a0000000-0000-0000-0000-000000000007', 'Travel', 'Fearless World Tour',            'First headlining world tour; 87 shows across North America, UK, Australia and Asia',                   'range', 2009, 2010,  '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000007', 'Travel', '1989 World Tour',                '85 shows across six continents; grossed $250M; featured surprise guest appearances each night',         'range', 2015, 2015,  '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000007', 'Travel', 'Eras Tour (global)',             '152 shows across five continents; first tour to gross over $1 billion; cultural phenomenon',           'range', 2023, 2024,  '#0ea5e9'),
  -- Health
  ('a0000000-0000-0000-0000-000000000007', 'Health', 'Eating disorder struggles',      'Opened up about battling anorexia and orthorexia throughout her early career; documented in "Miss Americana"', 'range', 2010, 2019, '#ef4444'),
  -- Relationships
  ('a0000000-0000-0000-0000-000000000007', 'Relationships', 'Jake Gyllenhaal',          'Relationship widely believed to inspire "All Too Well"; later subject of the re-recorded 10-min version', 'range', 2010, 2011, '#ec4899'),
  ('a0000000-0000-0000-0000-000000000007', 'Relationships', 'Harry Styles',             'Dated One Direction''s Harry Styles; inspired several songs; relationship followed closely by media',   'range', 2012, 2013,  '#ec4899'),
  ('a0000000-0000-0000-0000-000000000007', 'Relationships', 'Calvin Harris',            'Longest relationship before Joe Alwyn; dated DJ Calvin Harris for over a year',                       'range', 2015, 2016,  '#ec4899'),
  ('a0000000-0000-0000-0000-000000000007', 'Relationships', 'Joe Alwyn',               'British actor; low-profile 6-year relationship; inspired folklore and evermore albums; broke up 2023',  'range', 2017, 2023,  '#ec4899'),
  ('a0000000-0000-0000-0000-000000000007', 'Relationships', 'Travis Kelce',             'NFL Kansas City Chiefs tight end; went public 2023; global media attention; attended Super Bowl LVIII', 'range', 2023, 2026, '#ec4899'),
  -- Achievements
  ('a0000000-0000-0000-0000-000000000007', 'Achievements', 'First #1 album at 16',     'Fearless debuted at #1 on Billboard 200 when Swift was just 18; she had started writing it at 16',    'point', 2008, null,  '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000007', 'Achievements', '4× Grammy Album of the Year','Only artist to win Grammy Album of the Year four times: Fearless, 1989, Folklore, Midnights',        'range', 2010, 2024,  '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000007', 'Achievements', 'Billionaire status',        'Became a billionaire in 2023 — largely through music catalogue and Eras Tour revenue',                 'point', 2023, null,  '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000007', 'Achievements', 'TIME Person of the Year',  'Named TIME Magazine''s Person of the Year for 2023 — the first solo musician to receive the honour',   'point', 2023, null,  '#f59e0b');

-- ============================================================
-- CRISTIANO RONALDO  (born 5 Feb 1985)
-- ============================================================
INSERT INTO public.personas (id, name, bio, birth_year, death_year) VALUES (
  'a0000000-0000-0000-0000-000000000008',
  'Cristiano Ronaldo',
  'Portuguese professional footballer, widely regarded as one of the greatest of all time. Five-time Ballon d''Or winner. Born in Funchal, Madeira; joined Sporting CP academy at 12. Set records at Manchester United, Real Madrid, and Juventus before moving to Al Nassr in Saudi Arabia. International captain and record holder for most international goals.',
  1985, null
);

INSERT INTO public.persona_events (persona_id, lane_name, title, description, type, start_year, end_year, color) VALUES
  -- Locations
  ('a0000000-0000-0000-0000-000000000008', 'Locations', 'Funchal, Madeira, Portugal',  'Born and raised in Santo António, Funchal; grew up in poverty; father was a gardener and kit man',   'range', 1985, 1997,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000008', 'Locations', 'Lisbon, Portugal',            'Joined Sporting CP academy in Lisbon aged 12; left Madeira alone; cried homesickness initially',       'range', 1997, 2003,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000008', 'Locations', 'Manchester, England',         'Signed by Manchester United; bought a mansion in Cheshire; became the most expensive teen signing',    'range', 2003, 2009,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000008', 'Locations', 'Madrid, Spain',               'Signed to Real Madrid; lived in La Finca gated community; nine prolific years in Spain',               'range', 2009, 2018,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000008', 'Locations', 'Turin, Italy',                'Moved to Turin for Juventus; lived in a luxury villa; three seasons in Serie A',                       'range', 2018, 2021,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000008', 'Locations', 'Manchester, England (return)','Returned to Manchester United; lived in Cheshire; left midway through 2022–23 season',                'range', 2021, 2022,  '#3b82f6'),
  ('a0000000-0000-0000-0000-000000000008', 'Locations', 'Riyadh, Saudi Arabia',        'Signed for Al Nassr; highest-paid footballer in history; lives in luxury compound in Riyadh',          'range', 2023, 2026,  '#3b82f6'),
  -- Education
  ('a0000000-0000-0000-0000-000000000008', 'Education', 'EB1 de Santo António School', 'Primary school in Funchal; expelled briefly for throwing a chair; described school as "not for him"',  'range', 1991, 1997,  '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000008', 'Education', 'Sporting CP Academy',         'Joined Sporting CP''s Academia de Futebol in Lisbon; left school aged 16 to focus entirely on football', 'range', 1997, 2002, '#8b5cf6'),
  -- Work (football clubs)
  ('a0000000-0000-0000-0000-000000000008', 'Work', 'Sporting CP (debut)',              'Made senior debut for Sporting CP aged 17; immediately caught attention of European clubs',             'range', 2002, 2003,  '#10b981'),
  ('a0000000-0000-0000-0000-000000000008', 'Work', 'Manchester United (1st spell)',    'Signed for £12.24M aged 18; under Sir Alex Ferguson became the world''s best player',                  'range', 2003, 2009,  '#059669'),
  ('a0000000-0000-0000-0000-000000000008', 'Work', 'Real Madrid',                     'World-record £80M signing; scored 450 goals in 438 games; 4 Champions League titles; La Liga records', 'range', 2009, 2018,  '#10b981'),
  ('a0000000-0000-0000-0000-000000000008', 'Work', 'Juventus',                        'Signed for €100M; won 2 Serie A titles; top scorer in Serie A; left amid COVID-affected era',          'range', 2018, 2021,  '#059669'),
  ('a0000000-0000-0000-0000-000000000008', 'Work', 'Manchester United (2nd spell)',    'Emotional return ended controversially; publicly criticised the club in interview; contract terminated', 'range', 2021, 2022, '#047857'),
  ('a0000000-0000-0000-0000-000000000008', 'Work', 'Al Nassr, Saudi Arabia',          'Signed for reported €200M/year; became global ambassador for Saudi football',                           'range', 2023, 2026,  '#10b981'),
  ('a0000000-0000-0000-0000-000000000008', 'Work', 'Portugal National Team',          'Debuted aged 18; record 129+ international goals; led Portugal to Euro 2016 & Nations League 2019',    'range', 2003, 2026,  '#059669'),
  -- Travel
  ('a0000000-0000-0000-0000-000000000008', 'Travel', 'Left Madeira at 12',            'Boarded a plane alone for the first time to move to Lisbon; mother says he cried for weeks',            'point', 1997, null,  '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000008', 'Travel', 'World Cup campaigns',           'Represented Portugal at 5 World Cups (2006, 2010, 2014, 2018, 2022); best result: 3rd place 2006',     'range', 2006, 2022,  '#0ea5e9'),
  ('a0000000-0000-0000-0000-000000000008', 'Travel', 'Euro & Nations League tours',   'Multiple European Championship campaigns; finally won Euro 2016 in Paris; won Nations League 2019',     'range', 2004, 2022,  '#0ea5e9'),
  -- Health
  ('a0000000-0000-0000-0000-000000000008', 'Health', 'Heart surgery at 15',           'Diagnosed with racing heart (tachycardia); underwent laser surgery aged 15; nearly ended career early',  'point', 2000, null,  '#ef4444'),
  ('a0000000-0000-0000-0000-000000000008', 'Health', 'Knee injury concerns',          'Persistent knee issues throughout career managed with ice baths, strict diet and physiotherapy regime',   'range', 2012, 2022,  '#ef4444'),
  ('a0000000-0000-0000-0000-000000000008', 'Health', 'Extreme fitness regimen',       'Famously meticulous about diet and body fat; widely credited with extending peak career into his 30s',   'range', 2009, 2026,  '#ef4444'),
  -- Relationships
  ('a0000000-0000-0000-0000-000000000008', 'Relationships', 'Irina Shayk',            'Russian supermodel; dated 5 years; one of the most photographed celebrity couples of the era',          'range', 2010, 2015,  '#ec4899'),
  ('a0000000-0000-0000-0000-000000000008', 'Relationships', 'Georgina Rodríguez',      'Argentine-Spanish model; met in Madrid 2016; together since; mother of his youngest children',          'range', 2016, 2026,  '#ec4899'),
  -- Family
  ('a0000000-0000-0000-0000-000000000008', 'Family', 'Cristiano Jr (son)',            'First child; born 2010 via surrogate; mother never revealed; raised primarily by Ronaldo',               'point', 2010, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000008', 'Family', 'Eva & Mateo (twins)',           'Twin daughter and son born via surrogate in June 2017 while with Georgina',                             'point', 2017, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000008', 'Family', 'Alana Martina (daughter)',      'First daughter with Georgina Rodríguez; born November 2017',                                            'point', 2017, null,  '#f97316'),
  ('a0000000-0000-0000-0000-000000000008', 'Family', 'Bella (daughter)',              'Second daughter with Georgina; twin brother Angel died at birth in April 2022; publicly mourned',       'point', 2022, null,  '#f97316'),
  -- Achievements
  ('a0000000-0000-0000-0000-000000000008', 'Achievements', '1st Ballon d''Or',         'Won his first Ballon d''Or in 2008 after stellar season at Manchester United including Champions League', 'point', 2008, null, '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000008', 'Achievements', '5 Ballon d''Or awards',    'Won 2008, 2013, 2014, 2016, 2017 — five-time winner in one of football''s most prestigious honours',   'range', 2008, 2017,  '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000008', 'Achievements', 'UEFA Euro 2016 winner',   'Captained Portugal to their first major international trophy; left the final injured but cheered on',   'point', 2016, null,  '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000008', 'Achievements', '4× Champions League winner','Won UCL 2008 (Man Utd), 2014, 2016, 2017, 2018 (Real Madrid) — a record-equalling 5 total',          'range', 2008, 2018,  '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000008', 'Achievements', 'All-time international goalscorer', 'Broke the world record for international goals; scored 100th Portugal goal in 2021; 130+ by 2024', 'range', 2021, 2026, '#f59e0b'),
  ('a0000000-0000-0000-0000-000000000008', 'Achievements', 'First to 900 career goals', 'Became the first footballer to score 900 official career goals; milestone reached in 2024',           'point', 2024, null,  '#f59e0b');
