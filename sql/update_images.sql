ALTER TABLE restaurants ADD COLUMN image_url VARCHAR(255);

-- Update all restaurants to have a realistic food image URL based on their ID to keep it consistent
UPDATE restaurants SET image_url = CONCAT('https://loremflickr.com/600/400/food,malaysia?random=', id);
