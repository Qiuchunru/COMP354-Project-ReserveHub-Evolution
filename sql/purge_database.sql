-- sql/purge_database.sql
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `reviews`;
TRUNCATE TABLE `saved_restaurants`;
TRUNCATE TABLE `contact_messages`;
TRUNCATE TABLE `reservations`;
TRUNCATE TABLE `tables`;
TRUNCATE TABLE `restaurants`;

DELETE FROM `users` WHERE `email` != 'muhammad36163@gmail.com';

SET FOREIGN_KEY_CHECKS = 1;

-- Post-purge verification
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'restaurants', COUNT(*) FROM restaurants
UNION ALL
SELECT 'tables', COUNT(*) FROM `tables`
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'saved_restaurants', COUNT(*) FROM saved_restaurants
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'contact_messages', COUNT(*) FROM contact_messages;
