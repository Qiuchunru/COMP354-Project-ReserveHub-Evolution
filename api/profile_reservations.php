<?php
// api/profile_reservations.php
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$user_id = $data['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit;
}

try {
    $sql = "SELECT r.*, res.name as restaurant_name, res.image_url, t.table_number 
            FROM reservations r
            JOIN restaurants res ON r.restaurant_id = res.id
            JOIN `tables` t ON r.table_id = t.id
            WHERE r.user_id = ?
            ORDER BY r.date DESC, r.time DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $reservations
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
