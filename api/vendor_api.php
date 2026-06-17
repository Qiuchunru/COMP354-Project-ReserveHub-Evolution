<?php
// api/vendor_api.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'vendor') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$endpoint = $_GET['endpoint'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Get inputs from either GET, POST or JSON body
$data = json_decode(file_get_contents("php://input"), true) ?? [];
$userId = $_SESSION['user_id'];

try {

    switch ($endpoint) {
        case 'restaurants':
            if ($method === 'GET') {
                // Get all restaurants for this vendor
                $stmt = $pdo->prepare("SELECT * FROM restaurants WHERE vendor_id = ? ORDER BY id DESC");
                $stmt->execute([$userId]);
                $restaurants = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $restaurants]);
            } elseif ($method === 'POST') {
                $id = $_GET['id'] ?? $_POST['id'] ?? 0;
                $input = !empty($_POST) ? $_POST : $data;

                // Basic validation
                $name = trim($input['name'] ?? '');
                $description = trim($input['description'] ?? '');
                $cuisine = trim($input['cuisine'] ?? '');
                $location = trim($input['location'] ?? '');
                $priceRange = trim($input['price_range'] ?? '$$');
                $openingTime = trim($input['opening_time'] ?? '11:00:00');
                $closingTime = trim($input['closing_time'] ?? '22:00:00');
                $openingHours = trim($input['opening_hours'] ?? "$openingTime - $closingTime");
                
                if (empty($name) || empty($cuisine) || empty($location)) {
                    echo json_encode(['success' => false, 'message' => 'Name, cuisine, and location are required.']);
                    exit;
                }

                $imageUrl = $input['image_url'] ?? '';

                // Handle Image Upload
                if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                    $uploadDir = '../pictures/restaurants/';
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0777, true);
                    }
                    
                    $fileTmpPath = $_FILES['image']['tmp_name'];
                    $fileName = $_FILES['image']['name'];
                    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                    $newFileName = uniqid('rest_') . '.' . $fileExtension;
                    $destPath = $uploadDir . $newFileName;
                    
                    if (move_uploaded_file($fileTmpPath, $destPath)) {
                        $imageUrl = '../pictures/restaurants/' . $newFileName;
                    }
                }

                if ($id) {
                    // Update: Verify vendor ownership first
                    $checkStmt = $pdo->prepare("SELECT id FROM restaurants WHERE id = ? AND vendor_id = ?");
                    $checkStmt->execute([$id, $userId]);
                    if (!$checkStmt->fetch()) {
                        echo json_encode(['success' => false, 'message' => 'Access denied: You do not own this restaurant.']);
                        exit;
                    }

                    $updateSql = "UPDATE restaurants SET name=?, description=?, cuisine=?, location=?, price_range=?, opening_time=?, closing_time=?, opening_hours=?, status='pending'";
                    $params = [$name, $description, $cuisine, $location, $priceRange, $openingTime, $closingTime, $openingHours];

                    if (!empty($imageUrl)) {
                        $updateSql .= ", image_url=?, image=?";
                        $params[] = $imageUrl;
                        $params[] = $imageUrl;
                    }
                    $updateSql .= " WHERE id=? AND vendor_id=?";
                    $params[] = $id;
                    $params[] = $userId;

                    $stmt = $pdo->prepare($updateSql);
                    $stmt->execute($params);
                    echo json_encode(['success' => true, 'message' => 'Restaurant updated successfully. Sent for admin re-approval.']);
                } else {
                    // Create
                    $stmt = $pdo->prepare("INSERT INTO restaurants (vendor_id, name, description, cuisine, location, price_range, opening_time, closing_time, opening_hours, image_url, image, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
                    $stmt->execute([
                        $userId, $name, $description, $cuisine, $location, 
                        $priceRange, $openingTime, $closingTime, $openingHours, 
                        $imageUrl, $imageUrl
                    ]);
                    $newRestId = $pdo->lastInsertId();

                    // Automatically create default tables for the restaurant so users can reserve
                    $tableStmt = $pdo->prepare("INSERT INTO `tables` (restaurant_id, table_number, capacity, shape, x_pos, y_pos) VALUES 
                        (?, 'T1', 2, 'round', 100, 100),
                        (?, 'T2', 4, 'rect', 300, 100),
                        (?, 'T3', 4, 'rect', 500, 100),
                        (?, 'T4', 6, 'rect', 700, 100)");
                    $tableStmt->execute([$newRestId, $newRestId, $newRestId, $newRestId]);

                    echo json_encode(['success' => true, 'message' => 'Restaurant listing submitted for approval!']);
                }
            } elseif ($method === 'DELETE') {
                $id = $_GET['id'] ?? 0;
                // Delete: Verify vendor ownership first
                $checkStmt = $pdo->prepare("SELECT id FROM restaurants WHERE id = ? AND vendor_id = ?");
                $checkStmt->execute([$id, $userId]);
                if (!$checkStmt->fetch()) {
                    echo json_encode(['success' => false, 'message' => 'Access denied: You do not own this restaurant.']);
                    exit;
                }

                $stmt = $pdo->prepare("DELETE FROM restaurants WHERE id = ? AND vendor_id = ?");
                $stmt->execute([$id, $userId]);
                echo json_encode(['success' => true, 'message' => 'Restaurant deleted successfully.']);
            }
            break;

        case 'reservations':
            if ($method === 'GET') {
                // View all reservations made at their restaurants
                $stmt = $pdo->prepare("
                    SELECT res.id, u.name as user_name, u.phone as user_phone, r.name as restaurant_name, r.image_url, t.table_number, res.date, res.time, res.guests, res.status
                    FROM reservations res
                    JOIN users u ON res.user_id = u.id
                    JOIN restaurants r ON res.restaurant_id = r.id
                    JOIN `tables` t ON res.table_id = t.id
                    WHERE r.vendor_id = ?
                    ORDER BY res.date DESC, res.time DESC
                ");
                $stmt->execute([$userId]);
                $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $reservations]);
            }
            break;

        case 'update_reservation':
            if ($method === 'POST') {
                $reservationId = $data['reservation_id'] ?? $_POST['reservation_id'] ?? null;
                $status = $data['status'] ?? $_POST['status'] ?? null; // 'confirmed' or 'cancelled'

                if (!$reservationId || !in_array($status, ['confirmed', 'cancelled'])) {
                    echo json_encode(['success' => false, 'message' => 'Invalid reservation ID or status.']);
                    exit;
                }

                // Verify the reservation is for a restaurant owned by this vendor
                $stmt = $pdo->prepare("
                    SELECT res.id 
                    FROM reservations res
                    JOIN restaurants r ON res.restaurant_id = r.id
                    WHERE res.id = ? AND r.vendor_id = ?
                ");
                $stmt->execute([$reservationId, $userId]);
                if (!$stmt->fetch()) {
                    echo json_encode(['success' => false, 'message' => 'Access denied: You do not own the restaurant for this reservation.']);
                    exit;
                }

                $updateStmt = $pdo->prepare("UPDATE reservations SET status = ? WHERE id = ?");
                $updateStmt->execute([$status, $reservationId]);
                echo json_encode(['success' => true, 'message' => 'Reservation status updated successfully.']);
            }
            break;

        case 'toggle_open':
            if ($method === 'POST') {
                $restId = $data['id'] ?? $_POST['id'] ?? 0;
                $isOpen = $data['is_open'] ?? $_POST['is_open'] ?? 1;

                $checkStmt = $pdo->prepare("SELECT id FROM restaurants WHERE id = ? AND vendor_id = ?");
                $checkStmt->execute([$restId, $userId]);
                if (!$checkStmt->fetch()) {
                    echo json_encode(['success' => false, 'message' => 'Access denied: You do not own this restaurant.']);
                    exit;
                }

                $stmt = $pdo->prepare("UPDATE restaurants SET is_open = ? WHERE id = ? AND vendor_id = ?");
                $stmt->execute([$isOpen, $restId, $userId]);
                echo json_encode(['success' => true, 'message' => 'Restaurant status updated.']);
            }
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid endpoint.']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
