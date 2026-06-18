<?php
// api/add_review.php
header('Content-Type: application/json');
require_once 'db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$user_id = $_SESSION['user_id'];
$restaurant_id = $data['restaurant_id'] ?? null;
$reservation_id = $data['reservation_id'] ?? null;
$rating = $data['rating'] ?? null;
$comment = $data['comment'] ?? '';

if (!$user_id || !$restaurant_id || !$rating) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

try {
    // Check if review already exists for this reservation to prevent duplicates
    if ($reservation_id) {
        $checkStmt = $pdo->prepare("SELECT review_id FROM reviews WHERE reservation_id = ?");
        $checkStmt->execute([$reservation_id]);
        if ($checkStmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'You have already reviewed this visit.']);
            exit;
        }
    }

    // Generate new alphanumeric review_id (rv001, rv002, …)
    $idStmt = $pdo->query("SELECT COALESCE(MAX(CAST(SUBSTRING(review_id, 3) AS UNSIGNED)), 0) + 1 FROM reviews");
    $new_review_id = 'rv' . str_pad($idStmt->fetchColumn(), 3, '0', STR_PAD_LEFT);

    $sql = "INSERT INTO reviews (review_id, customer_id, restaurant_id, reservation_id, rating, comment) 
            VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$new_review_id, $user_id, $restaurant_id, $reservation_id, $rating, $comment]);

    // No need to sync restaurants.rating — it is computed live from this table
    // via COALESCE(AVG(reviews.rating), seed_rating) in all read queries.

    echo json_encode(['success' => true, 'message' => 'Review added successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
