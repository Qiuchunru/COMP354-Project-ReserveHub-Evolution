<?php
// api/active_reservation.php
header('Content-Type: application/json');
require_once 'db.php';

session_start();
$user_id = $_SESSION['user_id'] ?? null;
$restaurant_id = $_GET['restaurant_id'] ?? null;

if (!$user_id || !$restaurant_id) {
    echo json_encode(['success' => false, 'message' => 'Missing parameters or not logged in']);
    exit;
}

try {
    // Find a reservation for today that is currently active or upcoming today
    $stmt = $pdo->prepare("
        SELECT booking_id as id, date, reservation_time as time, table_id, guest_count as guests, status
        FROM reservations
        WHERE customer_id = ? 
          AND restaurant_id = ? 
          AND date = CURDATE()
          AND status IN ('pending', 'confirmed')
        ORDER BY reservation_time ASC
        LIMIT 1
    ");
    $stmt->execute([$user_id, $restaurant_id]);
    $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($reservation) {
        echo json_encode(['success' => true, 'data' => $reservation]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No active reservation found']);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
