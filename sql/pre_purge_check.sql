-- Verify target user
SELECT * FROM users WHERE email = 'muhammad36163@gmail.com';

-- Count rows in all tables
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
