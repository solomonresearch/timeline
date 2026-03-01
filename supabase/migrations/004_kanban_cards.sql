-- Create kanban_cards table
CREATE TABLE kanban_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_kanban_cards_status_position ON kanban_cards (status, position);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_kanban_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kanban_cards_updated_at
BEFORE UPDATE ON kanban_cards
FOR EACH ROW
EXECUTE FUNCTION update_kanban_updated_at();

-- Enable RLS
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Authenticated users can read kanban_cards" ON kanban_cards
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert kanban_cards" ON kanban_cards
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update kanban_cards" ON kanban_cards
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete kanban_cards" ON kanban_cards
  FOR DELETE TO authenticated USING (true);
