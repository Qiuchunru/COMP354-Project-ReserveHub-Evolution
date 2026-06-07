<?php
// api/search.php
header('Content-Type: application/json');
require_once 'db.php';

$query = $_GET['q'] ?? '';
$location = $_GET['location'] ?? '';
$time = $_GET['time'] ?? '';
$halal = $_GET['halal'] ?? '';

$sql = "SELECT * FROM restaurants WHERE status = 'approved'";
$params = [];

if (!empty($query)) {
    $sql .= " AND (name LIKE ? OR cuisine LIKE ?)";
    $params[] = "%$query%";
    $params[] = "%$query%";
}

if (!empty($location)) {
    $sql .= " AND location LIKE ?";
    $params[] = "%$location%";
}

if ($halal !== '') {
    $sql .= " AND is_halal = ?";
    $params[] = (int)$halal;
}

if (!empty($time)) {
    // Assuming time is provided in HH:MM format
    $sql .= " AND opening_time <= ? AND closing_time >= ?";
    $params[] = $time;
    $params[] = $time;
}

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $restaurants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $restaurants
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
