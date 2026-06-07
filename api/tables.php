<?php
// api/tables.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'db.php';

$restaurant_id = $_GET['restaurant_id'] ?? null;
$date          = $_GET['date']          ?? null;
$time          = $_GET['time']          ?? null;

if (!$restaurant_id || !is_numeric($restaurant_id)) {
    echo json_encode(['success' => false, 'message' => 'Invalid restaurant ID']);
    exit;
}

try {
    if ($date && $time) {
        // Compute per-table availability for a specific date/time window (±90 min)
        $stmt = $pdo->prepare("
            SELECT t.*,
                   CASE WHEN r.id IS NOT NULL THEN 'occupied' ELSE 'available' END AS status
            FROM `tables` t
            LEFT JOIN reservations r
                ON  r.table_id      = t.id
                AND r.date          = ?
                AND ABS(TIMESTAMPDIFF(MINUTE, r.time, CAST(? AS TIME))) < 90
                AND r.status       != 'cancelled'
            WHERE t.restaurant_id = ?
            ORDER BY t.table_number
        ");
        $stmt->execute([$date, $time, $restaurant_id]);
    } else {
        // No date/time filter — all tables default to available
        $stmt = $pdo->prepare("
            SELECT t.*, 'available' AS status
            FROM `tables` t
            WHERE t.restaurant_id = ?
            ORDER BY t.table_number
        ");
        $stmt->execute([$restaurant_id]);
    }

    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $tables]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
