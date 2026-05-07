<?php
// api/tables.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'db.php';

$restaurant_id = $_GET['restaurant_id'] ?? null;
$date = $_GET['date'] ?? null;
$time = $_GET['time'] ?? null;

if (!$restaurant_id || !is_numeric($restaurant_id)) {
    echo json_encode(['success' => false, 'message' => 'Invalid restaurant ID']);
    exit;
}

try {
    // Get all tables for this restaurant
    $stmt = $pdo->prepare("SELECT * FROM `tables` WHERE restaurant_id = ? ORDER BY table_number");
    $stmt->execute([$restaurant_id]);
    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // If date and time provided, mark tables that are already reserved as 'occupied'
    if ($date && $time) {
        $reservedStmt = $pdo->prepare(
            "SELECT table_id FROM reservations 
             WHERE restaurant_id = ? AND date = ? AND ABS(TIMESTAMPDIFF(MINUTE, time, ?)) < 90
             AND status != 'cancelled'"
        );
        $reservedStmt->execute([$restaurant_id, $date, $time]);
        $reserved = $reservedStmt->fetchAll(PDO::FETCH_COLUMN);

        foreach ($tables as &$table) {
            if (in_array($table['id'], $reserved)) {
                $table['status'] = 'occupied';
            }
        }
    }

    echo json_encode(['success' => true, 'data' => $tables]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
