-- =============================================================================
-- sql/migrate_phase2_column_renames.sql
-- Phase 2: Column renames + alphanumeric ID conversion
--
-- Tables affected:
--   users            : id          → user_id  (VARCHAR, already alphanumeric c001…)
--   reviews          : id INT      → review_id VARCHAR(20), format rv001…
--   saved_restaurants: id INT      → saved_id  VARCHAR(20), format s001…
--   contact_messages : id INT      → message_id VARCHAR(20), format m001…
--
-- Run via phpMyAdmin or:
--   mysql -u root reserve-hub < sql/migrate_phase2_column_renames.sql
-- =============================================================================

USE `reserve-hub`;

-- Temporarily disable FK checks so we can safely alter referenced columns
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. USERS TABLE: rename `id` → `user_id`
--    Type is already VARCHAR(20) and values are already alphanumeric (c001 …)
-- =============================================================================

-- Only run if `user_id` column does not yet exist
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'users'
      AND COLUMN_NAME  = 'user_id'
);

-- MariaDB / MySQL: use a prepared statement to conditionally execute
SET @sql = IF(
    @col_exists = 0,
    'ALTER TABLE users CHANGE COLUMN `id` `user_id` VARCHAR(20) NOT NULL',
    'SELECT ''users.user_id already exists — skipping rename'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update dependent FK columns (already VARCHAR; values already propagated by phase 1)
-- restaurants.vendor_id  references users(user_id) — no data change needed
-- reservations.customer_id — no data change needed
-- reservations.managed_by  — no data change needed
-- reviews.customer_id      — no data change needed
-- saved_restaurants.customer_id — no data change needed

-- =============================================================================
-- 2. REVIEWS TABLE: id INT → review_id VARCHAR(20), format rv001
-- =============================================================================

-- Step A: Add new column next to old id (only if not already there)
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'reviews'
      AND COLUMN_NAME  = 'review_id'
);

SET @sql = IF(
    @col_exists = 0,
    'ALTER TABLE reviews ADD COLUMN `review_id` VARCHAR(20) NULL AFTER `id`',
    'SELECT ''reviews.review_id already exists — skipping ADD'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step B: Populate review_id from existing int id (only rows not yet converted)
UPDATE reviews
SET review_id = CONCAT('rv', LPAD(id, 3, '0'))
WHERE review_id IS NULL AND id IS NOT NULL;

-- Step C: Drop old PK, drop old id column, promote review_id to PK
--         Only if the old `id` column still exists
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'reviews'
      AND COLUMN_NAME  = 'id'
);

SET @sql = IF(
    @col_exists > 0,
    'ALTER TABLE reviews DROP PRIMARY KEY, DROP COLUMN `id`, ADD PRIMARY KEY (`review_id`)',
    'SELECT ''reviews.id already removed — skipping DROP'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- 3. SAVED_RESTAURANTS TABLE: id INT → saved_id VARCHAR(20), format s001
-- =============================================================================

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'saved_restaurants'
      AND COLUMN_NAME  = 'saved_id'
);

SET @sql = IF(
    @col_exists = 0,
    'ALTER TABLE saved_restaurants ADD COLUMN `saved_id` VARCHAR(20) NULL AFTER `id`',
    'SELECT ''saved_restaurants.saved_id already exists — skipping ADD'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE saved_restaurants
SET saved_id = CONCAT('s', LPAD(id, 3, '0'))
WHERE saved_id IS NULL AND id IS NOT NULL;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'saved_restaurants'
      AND COLUMN_NAME  = 'id'
);

SET @sql = IF(
    @col_exists > 0,
    'ALTER TABLE saved_restaurants DROP PRIMARY KEY, DROP COLUMN `id`, ADD PRIMARY KEY (`saved_id`)',
    'SELECT ''saved_restaurants.id already removed — skipping DROP'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- 4. CONTACT_MESSAGES TABLE: id INT → message_id VARCHAR(20), format m001
--    Table may not exist yet — create it with message_id if absent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS `contact_messages` (
    `message_id` VARCHAR(20) NOT NULL,
    `name`       VARCHAR(100) NOT NULL,
    `email`      VARCHAR(100) NOT NULL,
    `subject`    VARCHAR(255) NOT NULL,
    `message`    TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- If the table already existed with old `id` INT column, migrate it
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'contact_messages'
      AND COLUMN_NAME  = 'message_id'
);

SET @old_col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'contact_messages'
      AND COLUMN_NAME  = 'id'
);

-- Add message_id if missing
SET @sql = IF(
    @col_exists = 0,
    'ALTER TABLE contact_messages ADD COLUMN `message_id` VARCHAR(20) NULL AFTER `id`',
    'SELECT ''contact_messages.message_id already exists — skipping ADD'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Populate
UPDATE contact_messages
SET message_id = CONCAT('m', LPAD(id, 3, '0'))
WHERE message_id IS NULL AND id IS NOT NULL;

-- Drop old id, promote PK
SET @sql = IF(
    @old_col_exists > 0,
    'ALTER TABLE contact_messages DROP PRIMARY KEY, DROP COLUMN `id`, ADD PRIMARY KEY (`message_id`)',
    'SELECT ''contact_messages.id already removed — skipping DROP'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================================
-- 5. RE-ADD FOREIGN KEYS pointing to users(user_id)
-- =============================================================================

-- Drop old FK names first (ignore errors if they do not exist)
ALTER TABLE restaurants
    DROP FOREIGN KEY IF EXISTS fk_restaurants_vendor,
    DROP FOREIGN KEY IF EXISTS fk_restaurants_vendor_dump;

ALTER TABLE reservations
    DROP FOREIGN KEY IF EXISTS reservations_ibfk_1;

ALTER TABLE reviews
    DROP FOREIGN KEY IF EXISTS reviews_ibfk_1;

ALTER TABLE saved_restaurants
    DROP FOREIGN KEY IF EXISTS saved_restaurants_ibfk_1;

-- Re-add FKs referencing the new column name
ALTER TABLE restaurants
    ADD CONSTRAINT fk_restaurants_vendor
    FOREIGN KEY (vendor_id) REFERENCES users(user_id) ON DELETE SET NULL;

ALTER TABLE reservations
    ADD CONSTRAINT reservations_ibfk_1
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE reviews
    ADD CONSTRAINT reviews_ibfk_1
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE saved_restaurants
    ADD CONSTRAINT saved_restaurants_ibfk_1
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- =============================================================================
-- 6. RECREATE restaurant_display VIEW (references users(user_id) is indirect,
--    but reviews join is fine; update just in case)
-- =============================================================================
CREATE OR REPLACE VIEW restaurant_display AS
SELECT
    r.restaurant_id,
    r.name,
    r.description,
    r.cuisine,
    r.location,
    r.price_range,
    r.seed_rating,
    ROUND(COALESCE(AVG(rev.rating), r.seed_rating), 1) AS rating,
    r.opening_time,
    r.closing_time,
    r.image_url,
    r.is_halal
FROM restaurants r
LEFT JOIN reviews rev ON rev.restaurant_id = r.restaurant_id
GROUP BY r.restaurant_id;

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- VERIFICATION QUERIES (run manually to confirm)
-- =============================================================================
-- DESCRIBE users;
-- DESCRIBE reviews;
-- DESCRIBE saved_restaurants;
-- DESCRIBE contact_messages;
-- SELECT user_id FROM users LIMIT 5;
-- SELECT review_id FROM reviews LIMIT 5;
-- SELECT saved_id FROM saved_restaurants LIMIT 5;
-- SELECT message_id FROM contact_messages LIMIT 5;
