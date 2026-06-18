-- =============================================================================
-- sql/migrate_fk_reservations_restaurants.sql
-- Adds the missing foreign key constraint linking reservations to restaurants
-- =============================================================================

USE `reserve-hub`;

-- Ensure there are no orphaned records first (handle them by deleting or setting to NULL if allowed)
-- In this case, we just delete orphaned reservations since a reservation without a valid restaurant makes no sense.
DELETE res
FROM reservations res
LEFT JOIN restaurants r ON res.restaurant_id = r.restaurant_id
WHERE r.restaurant_id IS NULL;

-- Add the foreign key constraint
ALTER TABLE `reservations`
  ADD CONSTRAINT `fk_reservations_restaurants` 
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) 
  ON DELETE CASCADE
  ON UPDATE CASCADE;
