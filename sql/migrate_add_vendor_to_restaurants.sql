-- ============================================================
-- Migration: Add vendor columns and status to restaurants
-- ------------------------------------------------------------
-- Adds:
-- 1. `vendor_id` referencing users(id)
-- 2. `opening_hours` for storing formatted opening timings
-- 3. `image` as a backup/alternative image path
-- 4. `status` to track restaurant approval status
-- ============================================================

ALTER TABLE `restaurants`
  ADD COLUMN `vendor_id` INT DEFAULT NULL AFTER `id`,
  ADD COLUMN `opening_hours` VARCHAR(100) DEFAULT NULL AFTER `closing_time`,
  ADD COLUMN `image` VARCHAR(255) DEFAULT NULL AFTER `image_url`,
  ADD COLUMN `status` VARCHAR(50) DEFAULT 'approved' AFTER `image`;

-- Add foreign key constraint for vendor_id
ALTER TABLE `restaurants`
  ADD CONSTRAINT `fk_restaurants_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
