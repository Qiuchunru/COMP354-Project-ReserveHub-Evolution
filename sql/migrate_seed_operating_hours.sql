-- migrate_seed_operating_hours.sql
-- -------------------------------------------------------
-- Safety-net: populate missing opening_time / closing_time
-- values with reasonable defaults (11:00 – 22:00).
--
-- All rows seeded via restaurants_data.sql already have
-- times set, so this UPDATE will typically affect 0 rows.
-- It exists to cover restaurants added through other means
-- (e.g. direct INSERT without the time columns).
-- -------------------------------------------------------

UPDATE `restaurants`
SET
    `opening_time` = '11:00:00',
    `closing_time` = '22:00:00'
WHERE `opening_time` IS NULL
   OR `closing_time` IS NULL;

-- Verify: show any remaining rows with NULL times
SELECT id, name, opening_time, closing_time
FROM `restaurants`
WHERE `opening_time` IS NULL
   OR `closing_time` IS NULL;
