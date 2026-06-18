-- sql/migrate_alphanumeric_ids.sql

-- 1. Drop Foreign Keys
-- 1. Drop Foreign Keys (Already done)
-- ALTER TABLE restaurants DROP FOREIGN KEY fk_restaurants_vendor;
-- ALTER TABLE tables DROP FOREIGN KEY tables_ibfk_1;
-- ALTER TABLE reservations DROP FOREIGN KEY reservations_ibfk_1;
-- ALTER TABLE reservations DROP FOREIGN KEY reservations_ibfk_2;
-- ALTER TABLE reviews DROP FOREIGN KEY reviews_ibfk_1;
-- ALTER TABLE reviews DROP FOREIGN KEY reviews_ibfk_2;
-- ALTER TABLE saved_restaurants DROP FOREIGN KEY saved_restaurants_ibfk_1;
-- ALTER TABLE saved_restaurants DROP FOREIGN KEY saved_restaurants_ibfk_2;

-- 2. Alter Columns to VARCHAR (Already done)
-- ALTER TABLE users MODIFY id VARCHAR(20) NOT NULL;
-- ALTER TABLE restaurants MODIFY restaurant_id VARCHAR(20) NOT NULL;
-- ALTER TABLE restaurants MODIFY vendor_id VARCHAR(20) DEFAULT NULL;
-- ALTER TABLE tables MODIFY table_id VARCHAR(20) NOT NULL;
-- ALTER TABLE tables MODIFY restaurant_id VARCHAR(20) NOT NULL;
-- ALTER TABLE reservations MODIFY booking_id VARCHAR(20) NOT NULL;
-- ALTER TABLE reservations MODIFY customer_id VARCHAR(20) NOT NULL;
-- ALTER TABLE reservations MODIFY restaurant_id VARCHAR(20) NOT NULL;
-- ALTER TABLE reservations MODIFY table_id VARCHAR(20) NOT NULL;
-- ALTER TABLE reviews MODIFY customer_id VARCHAR(20) NOT NULL;
-- ALTER TABLE reviews MODIFY restaurant_id VARCHAR(20) NOT NULL;
-- ALTER TABLE reviews MODIFY reservation_id VARCHAR(20) DEFAULT NULL;
-- ALTER TABLE saved_restaurants MODIFY customer_id VARCHAR(20) NOT NULL;
-- ALTER TABLE saved_restaurants MODIFY restaurant_id VARCHAR(20) NOT NULL;

UPDATE users SET id = CONCAT('c', LPAD(id, GREATEST(3, LENGTH(id)), '0')) WHERE id NOT LIKE 'c%';

UPDATE restaurants SET 
    restaurant_id = CONCAT('r', LPAD(restaurant_id, GREATEST(3, LENGTH(restaurant_id)), '0'))
    WHERE restaurant_id NOT LIKE 'r%';

UPDATE restaurants SET 
    vendor_id = CONCAT('c', LPAD(vendor_id, GREATEST(3, LENGTH(vendor_id)), '0'))
    WHERE vendor_id IS NOT NULL AND vendor_id NOT LIKE 'c%';

UPDATE tables SET 
    table_id = CONCAT('t', LPAD(table_id, GREATEST(3, LENGTH(table_id)), '0'))
    WHERE table_id NOT LIKE 't%';

UPDATE tables SET 
    restaurant_id = CONCAT('r', LPAD(restaurant_id, GREATEST(3, LENGTH(restaurant_id)), '0'))
    WHERE restaurant_id NOT LIKE 'r%';

UPDATE reservations SET booking_id = CONCAT('b', LPAD(booking_id, GREATEST(3, LENGTH(booking_id)), '0')) WHERE booking_id NOT LIKE 'b%';
UPDATE reservations SET customer_id = CONCAT('c', LPAD(customer_id, GREATEST(3, LENGTH(customer_id)), '0')) WHERE customer_id NOT LIKE 'c%';
UPDATE reservations SET restaurant_id = CONCAT('r', LPAD(restaurant_id, GREATEST(3, LENGTH(restaurant_id)), '0')) WHERE restaurant_id NOT LIKE 'r%';
UPDATE reservations SET table_id = CONCAT('t', LPAD(table_id, GREATEST(3, LENGTH(table_id)), '0')) WHERE table_id NOT LIKE 't%';

UPDATE reviews SET customer_id = CONCAT('c', LPAD(customer_id, GREATEST(3, LENGTH(customer_id)), '0')) WHERE customer_id NOT LIKE 'c%';
UPDATE reviews SET restaurant_id = CONCAT('r', LPAD(restaurant_id, GREATEST(3, LENGTH(restaurant_id)), '0')) WHERE restaurant_id NOT LIKE 'r%';
UPDATE reviews SET reservation_id = CONCAT('b', LPAD(reservation_id, GREATEST(3, LENGTH(reservation_id)), '0')) WHERE reservation_id IS NOT NULL AND reservation_id NOT LIKE 'b%';

UPDATE saved_restaurants SET customer_id = CONCAT('c', LPAD(customer_id, GREATEST(3, LENGTH(customer_id)), '0')) WHERE customer_id NOT LIKE 'c%';
UPDATE saved_restaurants SET restaurant_id = CONCAT('r', LPAD(restaurant_id, GREATEST(3, LENGTH(restaurant_id)), '0')) WHERE restaurant_id NOT LIKE 'r%';

-- 4. Re-add Foreign Keys
ALTER TABLE restaurants ADD CONSTRAINT fk_restaurants_vendor FOREIGN KEY (vendor_id) REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE tables ADD CONSTRAINT tables_ibfk_1 FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id) ON DELETE CASCADE;
ALTER TABLE reservations ADD CONSTRAINT reservations_ibfk_1 FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE reservations ADD CONSTRAINT reservations_ibfk_2 FOREIGN KEY (table_id) REFERENCES tables (table_id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_ibfk_1 FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_ibfk_2 FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id) ON DELETE CASCADE;
ALTER TABLE saved_restaurants ADD CONSTRAINT saved_restaurants_ibfk_1 FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE saved_restaurants ADD CONSTRAINT saved_restaurants_ibfk_2 FOREIGN KEY (restaurant_id) REFERENCES restaurants (restaurant_id) ON DELETE CASCADE;

-- 5. Recreate View (since underlying columns changed types)
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
