<?php
// api/get_saved.php
header('Content-Type: application/json');
require_once 'db.php';

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit;
}

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `saved_restaurants` (
        `saved_id` VARCHAR(20) NOT NULL,
        `customer_id` VARCHAR(20) NOT NULL,
        `restaurant_id` VARCHAR(20) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`saved_id`),
        UNIQUE KEY `unique_save` (`customer_id`, `restaurant_id`)
    )");
} catch (Exception $e) {}

try {
    $sql = "SELECT r.* FROM restaurants r
            JOIN saved_restaurants s ON r.restaurant_id = s.restaurant_id
            WHERE s.customer_id = ?
            ORDER BY s.created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    $restaurants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $restaurants
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
