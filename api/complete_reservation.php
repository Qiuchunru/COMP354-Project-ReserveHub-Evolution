<?php
// api/complete_reservation.php
header('Content-Type: application/json');
require_once 'db.php';

session_start();
$user_id = $_SESSION['user_id'] ?? null;

$data = json_decode(file_get_contents('php://input'), true);
$reservation_id = $data['reservation_id'] ?? null;

if (!$user_id || !$reservation_id) {
    echo json_encode(['success' => false, 'message' => 'Missing parameters or not logged in']);
    exit;
}

try {
    // Only allow completing a reservation if it belongs to the user
    // or if the user is an admin/vendor (we will just enforce user ownership for the timer)
    $stmt = $pdo->prepare("
        UPDATE reservations 
        SET status = 'completed'
        WHERE booking_id = ? AND customer_id = ? AND status IN ('pending', 'confirmed')
    ");
    $stmt->execute([$reservation_id, $user_id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Reservation completed']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Reservation could not be updated or already completed']);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
