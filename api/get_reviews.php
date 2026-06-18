<?php
// api/get_reviews.php
header('Content-Type: application/json');
require_once 'db.php';

$restaurant_id = $_GET['restaurant_id'] ?? null;

if (!$restaurant_id) {
    echo json_encode(['success' => false, 'message' => 'Restaurant ID is required']);
    exit;
}

try {
    $sql = "SELECT r.*, u.name as user_name, u.role as user_role 
            FROM reviews r
            JOIN users u ON r.customer_id = u.user_id
            WHERE r.restaurant_id = ?
            ORDER BY r.created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$restaurant_id]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $reviews
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
