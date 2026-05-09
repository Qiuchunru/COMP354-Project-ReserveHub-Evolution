<?php
// api/get_google_reviews.php
header('Content-Type: application/json');
require_once 'db.php';

$restaurant_id = $_GET['restaurant_id'] ?? null;

if (!$restaurant_id) {
    echo json_encode(['success' => false, 'message' => 'Restaurant ID is required']);
    exit;
}

// Mock Google Reviews data based on real restaurant names from the database
$google_reviews = [
    1 => [ // Madam Kwan's
        ['author' => 'Sarah J.', 'rating' => 5, 'text' => 'The Nasi Lemak is legendary! Best in KL for sure.', 'time' => '2 days ago'],
        ['author' => 'Mike Chen', 'rating' => 4, 'text' => 'Great atmosphere in Pavilion. Nasi Bojari was massive and delicious.', 'time' => '1 week ago'],
        ['author' => 'Elena Rodriguez', 'rating' => 3, 'text' => 'Food was good but service was a bit slow during lunch peak.', 'time' => '3 weeks ago']
    ],
    2 => [ // Bijan
        ['author' => 'David Tan', 'rating' => 5, 'text' => 'Incredible fine dining Malay experience. The beef rendang is melt-in-your-mouth.', 'time' => '5 days ago'],
        ['author' => 'Sophie L.', 'rating' => 5, 'text' => 'Beautiful setting for our anniversary. Highly recommended for a romantic dinner.', 'time' => '2 weeks ago']
    ],
    11 => [ // Village Park
        ['author' => 'Jason Low', 'rating' => 5, 'text' => 'Best Nasi Lemak in PJ! The fried chicken is perfection.', 'time' => '1 day ago'],
        ['author' => 'Amira Abdullah', 'rating' => 4, 'text' => 'Crowded but efficient. Definitely lives up to the hype.', 'time' => '4 days ago']
    ],
    18 => [ // Dewakan
        ['author' => 'Robert P.', 'rating' => 5, 'text' => 'A culinary journey like no other. Truly deserves the Michelin stars.', 'time' => '1 month ago'],
        ['author' => 'Grace Ng', 'rating' => 4, 'text' => 'Innovative flavors. Not every dish was my favorite, but the experience was 10/10.', 'time' => '2 months ago']
    ]
];

// Fallback for other restaurants
$generic_reviews = [
    ['author' => 'Local Guide', 'rating' => 4, 'text' => 'Great food and friendly staff. Will definitely visit again.', 'time' => '1 week ago'],
    ['author' => 'Foodie Explorer', 'rating' => 5, 'text' => 'Hidden gem! The flavors are authentic and well-balanced.', 'time' => '2 weeks ago']
];

$data = isset($google_reviews[$restaurant_id]) ? $google_reviews[$restaurant_id] : $generic_reviews;

echo json_encode([
    'success' => true,
    'source' => 'Google Maps',
    'data' => $data
]);
?>
