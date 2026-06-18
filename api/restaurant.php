<?php
// api/restaurant.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'db.php';

$id = $_GET['id'] ?? null;

if (!$id) {
    echo json_encode(['success' => false, 'message' => 'Invalid restaurant ID']);
    exit;
}

try {
    // Compute rating live from reviews; fall back to seed_rating when no reviews exist yet
    $stmt = $pdo->prepare("
        SELECT r.*,
               ROUND(COALESCE(AVG(rev.rating), r.seed_rating), 1) AS rating
        FROM restaurants r
        LEFT JOIN reviews rev ON rev.restaurant_id = r.restaurant_id
        WHERE r.restaurant_id = ?
        GROUP BY r.restaurant_id
    ");
    $stmt->execute([$id]);
    $restaurant = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$restaurant) {
        echo json_encode(['success' => false, 'message' => 'Restaurant not found']);
        exit;
    }

    echo json_encode(['success' => true, 'data' => $restaurant]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
