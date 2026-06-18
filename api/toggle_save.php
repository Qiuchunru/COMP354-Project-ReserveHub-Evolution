<?php
// api/toggle_save.php
header('Content-Type: application/json');
require_once 'db.php';

// Auto-migration for saved_restaurants
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `saved_restaurants` (
        `saved_id` VARCHAR(20) NOT NULL,
        `customer_id` VARCHAR(20) NOT NULL,
        `restaurant_id` VARCHAR(20) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`saved_id`),
        UNIQUE KEY `unique_save` (`customer_id`, `restaurant_id`)
    )");;
} catch (Exception $e) {
    // Ignore
}

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$user_id = $_SESSION['user_id'] ?? $data['user_id'] ?? null;
$restaurant_id = $data['restaurant_id'] ?? null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if (!$restaurant_id) {
    echo json_encode(['success' => false, 'message' => 'Restaurant ID is required']);
    exit;
}

try {
    // Check if already saved
    $checkStmt = $pdo->prepare("SELECT saved_id FROM saved_restaurants WHERE customer_id = ? AND restaurant_id = ?");
    $checkStmt->execute([$user_id, $restaurant_id]);
    $saved = $checkStmt->fetch();

    if ($saved) {
        // Unsave
        $stmt = $pdo->prepare("DELETE FROM saved_restaurants WHERE customer_id = ? AND restaurant_id = ?");
        $stmt->execute([$user_id, $restaurant_id]);
        echo json_encode(['success' => true, 'saved' => false, 'message' => 'Restaurant removed from wishlist']);
    } else {
        // Save — generate new alphanumeric saved_id (s001, s002, …)
        $idStmt = $pdo->query("SELECT COALESCE(MAX(CAST(SUBSTRING(saved_id, 2) AS UNSIGNED)), 0) + 1 FROM saved_restaurants");
        $new_saved_id = 's' . str_pad($idStmt->fetchColumn(), 3, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare("INSERT INTO saved_restaurants (saved_id, customer_id, restaurant_id) VALUES (?, ?, ?)");
        $stmt->execute([$new_saved_id, $user_id, $restaurant_id]);
        echo json_encode(['success' => true, 'saved' => true, 'message' => 'Restaurant added to wishlist']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
