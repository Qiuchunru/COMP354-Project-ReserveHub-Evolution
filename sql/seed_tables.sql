-- Seed floor plan tables for each restaurant
-- Each restaurant gets a unique table layout
-- Layout dimensions: 700 x 450 (SVG viewport)

-- Helper: generates tables for restaurant IDs 1-136 using repeating patterns
-- Pattern A: Cozy bistro (10 tables)
-- Pattern B: Medium (14 tables)
-- Pattern C: Large (18 tables)

-- PATTERN A layout (for restaurant IDs 1,4,7,10... % 3 = 1)
DROP PROCEDURE IF EXISTS seed_tables;

DELIMITER $$

CREATE PROCEDURE seed_tables()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE max_id INT;
  DECLARE pattern INT;
  DECLARE base_x INT;
  DECLARE base_y INT;
  SELECT MAX(id) INTO max_id FROM restaurants;
  
  -- Clear existing table data
  DELETE FROM `tables`;

  WHILE i <= max_id DO
    SET pattern = (i % 3);

    IF pattern = 1 THEN
      -- Pattern A: Cozy bistro - 10 tables
      INSERT INTO `tables` (restaurant_id, table_number, capacity, shape, x_pos, y_pos, status) VALUES
        (i, 'T1', 2, 'round', 80, 80, 'available'),
        (i, 'T2', 2, 'round', 200, 80, 'occupied'),
        (i, 'T3', 4, 'rect', 340, 60, 'available'),
        (i, 'T4', 4, 'rect', 500, 60, 'available'),
        (i, 'T5', 2, 'round', 80, 220, 'available'),
        (i, 'T6', 4, 'rect', 200, 200, 'occupied'),
        (i, 'T7', 6, 'rect', 380, 200, 'available'),
        (i, 'T8', 2, 'round', 580, 220, 'available'),
        (i, 'T9', 4, 'rect', 120, 350, 'available'),
        (i, 'T10', 6, 'rect', 380, 350, 'occupied');
    ELSEIF pattern = 2 THEN
      -- Pattern B: Medium restaurant - 14 tables
      INSERT INTO `tables` (restaurant_id, table_number, capacity, shape, x_pos, y_pos, status) VALUES
        (i, 'T1', 2, 'round', 70, 70, 'available'),
        (i, 'T2', 2, 'round', 170, 70, 'available'),
        (i, 'T3', 2, 'round', 270, 70, 'occupied'),
        (i, 'T4', 4, 'rect', 400, 55, 'available'),
        (i, 'T5', 4, 'rect', 540, 55, 'available'),
        (i, 'T6', 4, 'round', 70, 200, 'available'),
        (i, 'T7', 4, 'rect', 200, 185, 'occupied'),
        (i, 'T8', 6, 'rect', 370, 185, 'available'),
        (i, 'T9', 6, 'rect', 540, 185, 'occupied'),
        (i, 'T10', 2, 'round', 70, 340, 'available'),
        (i, 'T11', 4, 'rect', 200, 325, 'available'),
        (i, 'T12', 4, 'rect', 370, 325, 'available'),
        (i, 'T13', 8, 'rect', 510, 310, 'occupied'),
        (i, 'T14', 2, 'round', 610, 340, 'available');
    ELSE
      -- Pattern C: Large restaurant - 18 tables
      INSERT INTO `tables` (restaurant_id, table_number, capacity, shape, x_pos, y_pos, status) VALUES
        (i, 'T1', 2, 'round', 60, 60, 'available'),
        (i, 'T2', 2, 'round', 150, 60, 'occupied'),
        (i, 'T3', 4, 'rect', 250, 45, 'available'),
        (i, 'T4', 4, 'rect', 380, 45, 'available'),
        (i, 'T5', 4, 'rect', 500, 45, 'occupied'),
        (i, 'T6', 2, 'round', 610, 60, 'available'),
        (i, 'T7', 4, 'round', 60, 180, 'available'),
        (i, 'T8', 4, 'rect', 180, 165, 'occupied'),
        (i, 'T9', 6, 'rect', 340, 165, 'available'),
        (i, 'T10', 6, 'rect', 500, 165, 'available'),
        (i, 'T11', 8, 'rect', 60, 300, 'available'),
        (i, 'T12', 4, 'rect', 240, 300, 'occupied'),
        (i, 'T13', 4, 'round', 380, 310, 'available'),
        (i, 'T14', 4, 'round', 470, 310, 'available'),
        (i, 'T15', 2, 'round', 570, 310, 'available'),
        (i, 'T16', 6, 'rect', 60, 390, 'available'),
        (i, 'T17', 4, 'rect', 280, 390, 'occupied'),
        (i, 'T18', 8, 'rect', 490, 385, 'available');
    END IF;

    SET i = i + 1;
  END WHILE;
END$$

DELIMITER ;

CALL seed_tables();
DROP PROCEDURE IF EXISTS seed_tables;
