-- Remove duplicate "Köretek" category
DELETE FROM menu_categories 
WHERE id = '1a0bcaff-cded-4674-ab34-b5cc8546b24e' AND name = 'Köretek' AND sort = 120;