<?php
// api/get_daily_summary.php
header('Content-Type: application/json');
require_once 'db.php';

try {
    $sql = "SELECT res.name AS restaurant_name, COUNT(*) AS booking_count
            FROM reservations r
            JOIN restaurants res ON r.restaurant_id = res.restaurant_id
            WHERE DATE(r.date) = CURDATE()
            GROUP BY res.name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $summary = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $summary
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>