<?php
// api/toggle_save.php
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

if (!$restaurant_id) {
    echo json_encode(['success' => false, 'message' => 'Restaurant ID is required']);
    exit;
}

try {
    // Check if already saved
    $checkStmt = $pdo->prepare("SELECT id FROM saved_restaurants WHERE user_id = ? AND restaurant_id = ?");
    $checkStmt->execute([$user_id, $restaurant_id]);
    $saved = $checkStmt->fetch();

    if ($saved) {
        // Unsave
        $stmt = $pdo->prepare("DELETE FROM saved_restaurants WHERE user_id = ? AND restaurant_id = ?");
        $stmt->execute([$user_id, $restaurant_id]);
        echo json_encode(['success' => true, 'saved' => false, 'message' => 'Restaurant removed from wishlist']);
    } else {
        // Save
        $stmt = $pdo->prepare("INSERT INTO saved_restaurants (user_id, restaurant_id) VALUES (?, ?)");
        $stmt->execute([$user_id, $restaurant_id]);
        echo json_encode(['success' => true, 'saved' => true, 'message' => 'Restaurant added to wishlist']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
