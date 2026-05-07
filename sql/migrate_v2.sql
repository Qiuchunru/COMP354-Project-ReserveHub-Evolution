-- 1. Delete the 6 non-Malaysian placeholder restaurants (IDs 1-6)
DELETE FROM reservations WHERE restaurant_id IN (1,2,3,4,5,6);
DELETE FROM `tables` WHERE restaurant_id IN (1,2,3,4,5,6);
DELETE FROM restaurants WHERE id IN (1,2,3,4,5,6);

-- 2. Add halal column to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS `is_halal` TINYINT(1) NOT NULL DEFAULT 1;

-- 3. Update halal status based on cuisine type
-- Non-halal: Chinese pork dishes, western steakhouses with pork, etc.
UPDATE restaurants SET is_halal = 0 WHERE cuisine IN ('Chinese', 'Nyonya', 'Dim Sum', 'Taiwanese', 'Korean', 'Korean Japanese', 'Japanese', 'Western', 'Spanish', 'French', 'Italian', 'Cafe', 'Dessert', 'Farm to Table');
-- Re-mark obviously halal ones
UPDATE restaurants SET is_halal = 1 WHERE cuisine IN ('Malay', 'Indian', 'Mamak', 'Indian Muslim', 'Chinese Muslim', 'Seafood');
-- Specific overrides for well-known halal places
UPDATE restaurants SET is_halal = 1 WHERE name IN ('Nasi Lemak Bumbung', 'Nirwana Maju Bangsar', 'Restoran Yaashaa', 'Tapas Club', 'Wan Fo Yuan Vegetarian', 'Brasserie Leon', 'A Little Farm On The Hill');

-- 4. Add reviews table
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `restaurant_id` INT NOT NULL,
  `reservation_id` INT,
  `rating` TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `one_review_per_reservation` (`user_id`, `restaurant_id`, `reservation_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
);

-- 5. Update location filter options for Malaysian cities
-- (just a note - done in HTML)
