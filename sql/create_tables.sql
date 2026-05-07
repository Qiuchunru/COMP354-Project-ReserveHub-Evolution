-- Tables for restaurant floor plans
CREATE TABLE IF NOT EXISTS `tables` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `restaurant_id` INT NOT NULL,
  `table_number` VARCHAR(10) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 4,
  `shape` ENUM('round','rect') DEFAULT 'round',
  `x_pos` INT NOT NULL,
  `y_pos` INT NOT NULL,
  `status` ENUM('available','occupied') DEFAULT 'available',
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
);

-- Reservations table
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `restaurant_id` INT NOT NULL,
  `table_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `time` TIME NOT NULL,
  `guests` INT NOT NULL DEFAULT 2,
  `special_requests` TEXT,
  `status` ENUM('pending','confirmed','cancelled') DEFAULT 'confirmed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON DELETE CASCADE
);
