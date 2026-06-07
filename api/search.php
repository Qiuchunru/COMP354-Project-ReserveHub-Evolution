<?php
// api/search.php
header('Content-Type: application/json');
require_once 'db.php';

$query    = $_GET['q']        ?? '';
$location = $_GET['location'] ?? '';
$time     = $_GET['time']     ?? '';
$halal    = $_GET['halal']    ?? '';
$params   = [];

// Build the WHERE clause filters
// Rating is computed live from reviews (falls back to seed_rating)
$sql = "
    SELECT r.*,
           ROUND(COALESCE(AVG(rev.rating), r.seed_rating), 1) AS rating
    FROM restaurants r
    LEFT JOIN reviews rev ON rev.restaurant_id = r.id
    WHERE 1=1
";

if (!empty($query)) {
    $sql .= " AND (r.name LIKE ? OR r.cuisine LIKE ?)";
    $params[] = "%$query%";
    $params[] = "%$query%";
}

if (!empty($location)) {
    $sql .= " AND r.location LIKE ?";
    $params[] = "%$location%";
}

if ($halal !== '') {
    $sql .= " AND r.is_halal = ?";
    $params[] = (int)$halal;
}

if (!empty($time)) {
    $sql .= " AND r.opening_time <= ? AND r.closing_time >= ?";
    $params[] = $time;
    $params[] = $time;
}

$sql .= " GROUP BY r.id";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $restaurants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data'    => $restaurants
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
