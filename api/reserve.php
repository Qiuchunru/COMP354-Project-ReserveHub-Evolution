<?php
// api/reserve.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$user_id        = $_SESSION['user_id'];
$restaurant_id  = $data['restaurant_id'] ?? null;
$table_id       = $data['table_id'] ?? null;
$date           = $data['date'] ?? null;
$time           = $data['time'] ?? null;
$guests         = $data['guests'] ?? null;
$special_req    = $data['special_requests'] ?? '';

if (!$user_id || !$restaurant_id || !$table_id || !$date || !$time || !$guests) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

try {
    // Check if table is still available at this time
    $checkStmt = $pdo->prepare(
        "SELECT id FROM reservations
         WHERE table_id = ? AND date = ? AND ABS(TIMESTAMPDIFF(MINUTE, time, CAST(? AS TIME))) < 90
         AND status != 'cancelled'"
    );
    $checkStmt->execute([$table_id, $date, $time]);
    if ($checkStmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'This table has just been reserved. Please choose another.']);
        exit;
    }

    // Check table capacity vs guests
    $capStmt = $pdo->prepare("SELECT capacity FROM `tables` WHERE id = ?");
    $capStmt->execute([$table_id]);
    $tableRow = $capStmt->fetch(PDO::FETCH_ASSOC);
    if (!$tableRow) {
        echo json_encode(['success' => false, 'message' => 'Table not found']);
        exit;
    }
    if ($guests > $tableRow['capacity']) {
        echo json_encode(['success' => false, 'message' => "This table seats up to {$tableRow['capacity']} guests."]);
        exit;
    }

    // Insert reservation
    $stmt = $pdo->prepare(
        "INSERT INTO reservations (user_id, restaurant_id, table_id, date, time, guests, special_requests)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$user_id, $restaurant_id, $table_id, $date, $time, $guests, $special_req]);

    echo json_encode([
        'success' => true,
        'message' => 'Reservation confirmed!',
        'reservation_id' => $pdo->lastInsertId()
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
