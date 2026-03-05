-- Rename existing "Wealth" lanes to "Assets"
UPDATE lanes SET name = 'Assets' WHERE name = 'Wealth';
