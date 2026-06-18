-- Tables for restaurant floor plans
-- NOTE: Table availability is computed dynamically from the reservations table.
--       There is no static status column — see api/tables.php for the live query.
CREATE TABLE IF NOT EXISTS `tables` (
  `table_id` INT AUTO_INCREMENT PRIMARY KEY,
  `restaurant_id` INT NOT NULL,
  `table_number` VARCHAR(10) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 4,
  `shape` ENUM('round','rect') DEFAULT 'round',
  `canvas_x_coordinate` INT NOT NULL,
  `canvas_y_coordinate` INT NOT NULL,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`restaurant_id`) ON DELETE CASCADE
);

-- Reservations table
CREATE TABLE IF NOT EXISTS `reservations` (
  `booking_id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `restaurant_id` INT NOT NULL,
  `table_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `reservation_time` TIME NOT NULL,
  `guest_count` INT NOT NULL DEFAULT 2,
  `special_requests` TEXT,
  `status` ENUM('pending','confirmed','cancelled') DEFAULT 'confirmed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`table_id`) REFERENCES `tables`(`table_id`) ON DELETE CASCADE,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`restaurant_id`) ON DELETE CASCADE
);
