CREATE TABLE IF NOT EXISTS restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine VARCHAR(100),
    location VARCHAR(100),
    price_range VARCHAR(10),
    rating DECIMAL(3,1),
    opening_time TIME,
    closing_time TIME,
    image_gradient VARCHAR(100),
    icon VARCHAR(50)
);

-- Clear existing to avoid duplicates if run multiple times
TRUNCATE TABLE restaurants;

INSERT INTO restaurants (name, description, cuisine, location, price_range, seed_rating, opening_time, closing_time, image_gradient, icon) VALUES 
('La Bella Roma', 'Authentic wood-fired pizzas, hand-rolled pasta, and Italian classics in a warm, candlelit setting.', 'Italian', 'Downtown', '$$', 4.8, '11:00:00', '23:00:00', 'linear-gradient(135deg,#c0392b,#8e44ad)', 'fa-pizza-slice'),
('Sakura Garden', 'A zen-inspired dining journey through Japan, Korea, and Southeast Asia — each dish a masterpiece.', 'Asian Fusion', 'Midtown', '$$$', 4.9, '12:00:00', '22:30:00', 'linear-gradient(135deg,#16a085,#2980b9)', 'fa-bowl-rice'),
('The Blue Harbor', 'Fresh ocean-to-table seafood with panoramic harbor views. Famous for its lobster bisque.', 'Seafood', 'Waterfront', '$$$', 4.7, '11:30:00', '22:00:00', 'linear-gradient(135deg,#1a6b9a,#00b4db)', 'fa-fish'),
('Prime & Ember', 'Premium dry-aged steaks, expertly curated wines, and impeccable service in a sophisticated setting.', 'Steakhouse', 'Uptown', '$$$$', 4.9, '17:00:00', '23:30:00', 'linear-gradient(135deg,#7f5539,#b5451b)', 'fa-drumstick-bite'),
('Trattoria Nonna', 'Family recipes passed down three generations. Every bite tells a story of Sicilian heritage.', 'Italian', 'Old Quarter', '$$', 4.6, '10:00:00', '21:00:00', 'linear-gradient(135deg,#6c3483,#af7ac5)', 'fa-wine-glass'),
('Spice Republic', 'Bold Thai and Indian curries, street-food-inspired tapas, and a vibrant, colourful atmosphere.', 'Asian Fusion', 'Arts District', '$$', 4.8, '11:00:00', '23:00:00', 'linear-gradient(135deg,#1a7a4a,#52c234)', 'fa-pepper-hot');
