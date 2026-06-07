<?php
// api/restaurant.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'db.php';

$id = $_GET['id'] ?? null;

if (!$id || !is_numeric($id)) {
    echo json_encode(['success' => false, 'message' => 'Invalid restaurant ID']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM restaurants WHERE id = ? AND status = 'approved'");
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
