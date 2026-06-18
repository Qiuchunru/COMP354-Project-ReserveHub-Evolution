<?php
// api/vendor_tables.php — Vendor: read & update tables for their own restaurants
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'vendor') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$method   = $_SERVER['REQUEST_METHOD'];
$userId   = $_SESSION['user_id'];
$restId   = $_GET['restaurant_id'] ?? null;
$tableId  = $_GET['id'] ?? null;

try {
    if ($method === 'GET') {
        // GET: list tables for a restaurant owned by this vendor
        if (!$restId) { echo json_encode(['success' => false, 'message' => 'restaurant_id required']); exit; }

        $check = $pdo->prepare("SELECT restaurant_id FROM restaurants WHERE restaurant_id = ? AND vendor_id = ?");
        $check->execute([$restId, $userId]);
        if (!$check->fetch()) { echo json_encode(['success' => false, 'message' => 'Not your restaurant']); exit; }

        $stmt = $pdo->prepare("SELECT *, table_id AS id, canvas_x_coordinate AS x_pos, canvas_y_coordinate AS y_pos, 'available' AS status FROM `tables` WHERE restaurant_id = ? ORDER BY table_number");
        $stmt->execute([$restId]);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);

    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $restId = $data['restaurant_id'] ?? $restId;

        if (!$restId) { echo json_encode(['success' => false, 'message' => 'restaurant_id required']); exit; }

        $check = $pdo->prepare("SELECT restaurant_id FROM restaurants WHERE restaurant_id = ? AND vendor_id = ?");
        $check->execute([$restId, $userId]);
        if (!$check->fetch()) { echo json_encode(['success' => false, 'message' => 'Not your restaurant']); exit; }

        $tableNum = $data['table_number'] ?? '1';
        $capacity = (int)($data['capacity'] ?? 4);
        $shape    = in_array($data['shape'] ?? '', ['round', 'rect']) ? $data['shape'] : 'rect';
        $xPos     = (int)($data['x_pos'] ?? 100);
        $yPos     = (int)($data['y_pos'] ?? 100);

        $idStmt = $pdo->query("SELECT COALESCE(MAX(CAST(SUBSTRING(table_id, 2) AS UNSIGNED)), 0) + 1 FROM `tables`");
        $new_table_id = 't' . str_pad($idStmt->fetchColumn(), 3, '0', STR_PAD_LEFT);

        $stmt = $pdo->prepare("INSERT INTO `tables` (table_id, restaurant_id, table_number, capacity, shape, canvas_x_coordinate, canvas_y_coordinate) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$new_table_id, $restId, $tableNum, $capacity, $shape, $xPos, $yPos]);
        echo json_encode(['success' => true, 'id' => $new_table_id, 'message' => 'Table created.']);

    } elseif ($method === 'PUT') {
        if (!$tableId) { echo json_encode(['success' => false, 'message' => 'id required']); exit; }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Verify ownership via restaurant
        $check = $pdo->prepare("SELECT t.table_id FROM `tables` t JOIN restaurants r ON t.restaurant_id = r.restaurant_id WHERE t.table_id = ? AND r.vendor_id = ?");
        $check->execute([$tableId, $userId]);
        if (!$check->fetch()) { echo json_encode(['success' => false, 'message' => 'Not your table']); exit; }

        $tableNum = $data['table_number'] ?? null;
        $capacity = isset($data['capacity']) ? (int)$data['capacity'] : null;
        $shape    = isset($data['shape']) && in_array($data['shape'], ['round', 'rect']) ? $data['shape'] : null;
        $xPos     = isset($data['x_pos']) ? (int)$data['x_pos'] : null;
        $yPos     = isset($data['y_pos']) ? (int)$data['y_pos'] : null;

        $stmt = $pdo->prepare("UPDATE `tables` SET table_number=?, capacity=?, shape=?, canvas_x_coordinate=?, canvas_y_coordinate=? WHERE table_id=?");
        $stmt->execute([$tableNum, $capacity, $shape, $xPos, $yPos, $tableId]);
        echo json_encode(['success' => true, 'message' => 'Table updated.']);

    } elseif ($method === 'DELETE') {
        if (!$tableId) { echo json_encode(['success' => false, 'message' => 'id required']); exit; }

        $check = $pdo->prepare("SELECT t.table_id FROM `tables` t JOIN restaurants r ON t.restaurant_id = r.restaurant_id WHERE t.table_id = ? AND r.vendor_id = ?");
        $check->execute([$tableId, $userId]);
        if (!$check->fetch()) { echo json_encode(['success' => false, 'message' => 'Not your table']); exit; }

        $stmt = $pdo->prepare("DELETE FROM `tables` WHERE table_id = ?");
        $stmt->execute([$tableId]);
        echo json_encode(['success' => true, 'message' => 'Table deleted.']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
