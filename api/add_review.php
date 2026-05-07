<?php
// api/add_review.php
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$user_id = $data['user_id'] ?? null;
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
        $checkStmt = $pdo->prepare("SELECT id FROM reviews WHERE reservation_id = ?");
        $checkStmt->execute([$reservation_id]);
        if ($checkStmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'You have already reviewed this visit.']);
            exit;
        }
    }

    $sql = "INSERT INTO reviews (user_id, restaurant_id, reservation_id, rating, comment) 
            VALUES (?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id, $restaurant_id, $reservation_id, $rating, $comment]);

    // Optional: Update restaurant average rating
    $avgStmt = $pdo->prepare("SELECT AVG(rating) as avg_rating FROM reviews WHERE restaurant_id = ?");
    $avgStmt->execute([$restaurant_id]);
    $newAvg = $avgStmt->fetch(PDO::FETCH_ASSOC)['avg_rating'];

    if ($newAvg) {
        $updateStmt = $pdo->prepare("UPDATE restaurants SET rating = ? WHERE id = ?");
        $updateStmt->execute([round($newAvg, 1), $restaurant_id]);
    }

    echo json_encode(['success' => true, 'message' => 'Review added successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
