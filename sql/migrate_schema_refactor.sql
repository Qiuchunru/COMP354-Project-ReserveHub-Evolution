-- sql/migrate_schema_refactor.sql
-- Run this to apply the schema refactoring for the reserve-hub database

USE `reserve-hub`;

-- 1. restaurants table
-- (Already renamed id to restaurant_id in previous run. image column does not exist.)

-- 2. tables table
ALTER TABLE `tables` CHANGE COLUMN id table_id INT(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `tables` CHANGE COLUMN x_pos canvas_x_coordinate INT(11) NOT NULL;
ALTER TABLE `tables` CHANGE COLUMN y_pos canvas_y_coordinate INT(11) NOT NULL;

-- 3. reservations table
ALTER TABLE reservations DROP FOREIGN KEY reservations_ibfk_1;
ALTER TABLE reservations CHANGE COLUMN id booking_id INT(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE reservations CHANGE COLUMN user_id customer_id INT(11) NOT NULL;
ALTER TABLE reservations ADD CONSTRAINT reservations_ibfk_1 FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reservations CHANGE COLUMN guests guest_count INT(11) NOT NULL DEFAULT 2;
ALTER TABLE reservations CHANGE COLUMN time reservation_time TIME NOT NULL;

-- 4. reviews table
ALTER TABLE reviews DROP FOREIGN KEY reviews_ibfk_1;
ALTER TABLE reviews CHANGE COLUMN user_id customer_id INT(11) NOT NULL;
ALTER TABLE reviews ADD CONSTRAINT reviews_ibfk_1 FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;

-- 5. saved_restaurants table
ALTER TABLE saved_restaurants DROP FOREIGN KEY saved_restaurants_ibfk_1;
ALTER TABLE saved_restaurants CHANGE COLUMN user_id customer_id INT(11) NOT NULL;
ALTER TABLE saved_restaurants ADD CONSTRAINT saved_restaurants_ibfk_1 FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;

-- 6. users table (role change)
UPDATE users SET role = 'customer' WHERE role = 'user';
