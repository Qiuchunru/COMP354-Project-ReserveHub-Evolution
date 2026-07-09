<?php
// api/get_daily_summary.php

header('Content-Type: application/json');

require_once 'db.php';

// Admin only
if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode([
        'success'=>false,
        'message'=>'Unauthorized: admin access required.'
    ]);
    exit;
}

try {

    $sql = "
        SELECT 
            r.name AS restaurant_name,
            COUNT(*) AS booking_count
        FROM reservations res
        JOIN restaurants r 
            ON res.restaurant_id = r.restaurant_id
        WHERE DATE(res.date) = CURDATE()
        GROUP BY r.name
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $summary = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'=>true,
        'data'=>$summary
    ]);

} catch(PDOException $e){

    http_response_code(500);

    echo json_encode([
        'success'=>false,
        'message'=>'Database error'
    ]);
}
?>