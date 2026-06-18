-- ============================================================
-- Migration: Computed rating + restaurant_display VIEW
-- ------------------------------------------------------------
-- 1. Renames `restaurants.rating` → `restaurants.seed_rating`
--    Seed values are preserved as a fallback for restaurants
--    with no reviews yet.
-- 2. Creates a VIEW `restaurant_display` exposing only clean
--    logical columns — hiding UI-specific image_gradient/icon.
-- ============================================================
-- Run this ONCE in phpMyAdmin > SQL tab on database: reserve-hub
-- ============================================================

-- Step 1: Rename column (MariaDB 10.5.2+ / MySQL 8.0+)
ALTER TABLE `restaurants`
    CHANGE COLUMN `rating` `seed_rating` DECIMAL(3,1) DEFAULT NULL;

-- Step 2: Create the clean display VIEW
--  - `rating` is computed live from reviews (falls back to seed_rating)
--  - UI-only columns (image_gradient, icon) are excluded
CREATE OR REPLACE VIEW `restaurant_display` AS
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
