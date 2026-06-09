<?php
// api/vendor_tables.php — Vendor: read & update tables for their own restaurants
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'db.php';

$method   = $_SERVER['REQUEST_METHOD'];
$userId   = $_GET['user_id'] ?? $_POST['user_id'] ?? null;
$restId   = $_GET['restaurant_id'] ?? null;
$tableId  = $_GET['id'] ?? null;

// Always require user_id
if (!$userId || !is_numeric($userId)) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Verify vendor role
$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$user || $user['role'] !== 'vendor') {
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

try {
    if ($method === 'GET') {
        // GET: list tables for a restaurant owned by this vendor
        if (!$restId) { echo json_encode(['success' => false, 'message' => 'restaurant_id required']); exit; }

        $check = $pdo->prepare("SELECT id FROM restaurants WHERE id = ? AND vendor_id = ?");
        $check->execute([$restId, $userId]);
        if (!$check->fetch()) { echo json_encode(['success' => false, 'message' => 'Not your restaurant']); exit; }

        $stmt = $pdo->prepare("SELECT *, 'available' AS status FROM `tables` WHERE restaurant_id = ? ORDER BY table_number");
        $stmt->execute([$restId]);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);

    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $restId = $data['restaurant_id'] ?? $restId;

        if (!$restId) { echo json_encode(['success' => false, 'message' => 'restaurant_id required']); exit; }

        $check = $pdo->prepare("SELECT id FROM restaurants WHERE id = ? AND vendor_id = ?");
        $check->execute([$restId, $userId]);
        if (!$check->fetch()) { echo json_encode(['success' => false, 'message' => 'Not your restaurant']); exit; }

        $tableNum = $data['table_number'] ?? '1';
        $capacity = (int)($data['capacity'] ?? 4);
        $shape    = in_array($data['shape'] ?? '', ['round', 'rect']) ? $data['shape'] : 'rect';
        $xPos     = (int)($data['x_pos'] ?? 100);
        $yPos     = (int)($data['y_pos'] ?? 100);

        $stmt = $pdo->prepare("INSERT INTO `tables` (restaurant_id, table_number, capacity, shape, x_pos, y_pos) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$restId, $tableNum, $capacity, $shape, $xPos, $yPos]);
        echo json_encode(['success' => true, 'id' => (int)$pdo->lastInsertId(), 'message' => 'Table created.']);

    } elseif ($method === 'PUT') {
        if (!$tableId) { echo json_encode(['success' => false, 'message' => 'id required']); exit; }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Verify ownership via restaurant
        $check = $pdo->prepare("SELECT t.id FROM `tables` t JOIN restaurants r ON t.restaurant_id = r.id WHERE t.id = ? AND r.vendor_id = ?");
        $check->execute([$tableId, $userId]);
        if (!$check->fetch()) { echo json_encode(['success' => false, 'message' => 'Not your table']); exit; }

        $tableNum = $data['table_number'] ?? null;
        $capacity = isset($data['capacity']) ? (int)$data['capacity'] : null;
        $shape    = isset($data['shape']) && in_array($data['shape'], ['round', 'rect']) ? $data['shape'] : null;
        $xPos     = isset($data['x_pos']) ? (int)$data['x_pos'] : null;
        $yPos     = isset($data['y_pos']) ? (int)$data['y_pos'] : null;

        $stmt = $pdo->prepare("UPDATE `tables` SET table_number=?, capacity=?, shape=?, x_pos=?, y_pos=? WHERE id=?");
        $stmt->execute([$tableNum, $capacity, $shape, $xPos, $yPos, $tableId]);
        echo json_encode(['success' => true, 'message' => 'Table updated.']);

    } elseif ($method === 'DELETE') {
        if (!$tableId) { echo json_encode(['success' => false, 'message' => 'id required']); exit; }

        $check = $pdo->prepare("SELECT t.id FROM `tables` t JOIN restaurants r ON t.restaurant_id = r.id WHERE t.id = ? AND r.vendor_id = ?");
        $check->execute([$tableId, $userId]);
        if (!$check->fetch()) { echo json_encode(['success' => false, 'message' => 'Not your table']); exit; }

        $stmt = $pdo->prepare("DELETE FROM `tables` WHERE id = ?");
        $stmt->execute([$tableId]);
        echo json_encode(['success' => true, 'message' => 'Table deleted.']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
