<?php
// Database connection
require_once 'db.php';

// Auto-migration: Ensure image_url column exists
try {
    $pdo->exec("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) AFTER image_gradient");
} catch (Exception $e) {
    // Ignore if already exists or other issues, but at least we tried
}

header('Content-Type: application/json');

$endpoint = $_GET['endpoint'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true) ?? [];

try {
    switch ($endpoint) {
        case 'analytics':
            if ($method === 'GET') {
                $totalUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
                $totalRes = $pdo->query("SELECT COUNT(*) FROM reservations")->fetchColumn();
                $totalRests = $pdo->query("SELECT COUNT(*) FROM restaurants")->fetchColumn();
                
                $popRes = $pdo->query("
                    SELECT r.name, COUNT(res.id) as res_count 
                    FROM restaurants r
                    LEFT JOIN reservations res ON r.id = res.restaurant_id
                    GROUP BY r.id
                    ORDER BY res_count DESC
                    LIMIT 5
                ")->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode(['success' => true, 'data' => [
                    'users' => $totalUsers,
                    'reservations' => $totalRes,
                    'restaurants' => $totalRests,
                    'popular' => $popRes
                ]]);
            }
            break;

        case 'users':
            if ($method === 'GET') {
                $users = $pdo->query("SELECT id, name, email, phone, created_at FROM users ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $users]);
            }
            break;

        case 'reservations':
            if ($method === 'GET') {
                $res = $pdo->query("
                    SELECT res.id, u.name as user_name, u.phone as user_phone, r.name as restaurant_name, r.image_url, t.table_number, res.date, res.time, res.guests, res.status
                    FROM reservations res
                    JOIN users u ON res.user_id = u.id
                    JOIN restaurants r ON res.restaurant_id = r.id
                    JOIN `tables` t ON res.table_id = t.id
                    ORDER BY res.date DESC, res.time DESC
                ")->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $res]);
            } elseif ($method === 'DELETE') {
                $id = $_GET['id'] ?? 0;
                $stmt = $pdo->prepare("DELETE FROM reservations WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
            }
            break;

        case 'restaurants':
            if ($method === 'GET') {
                // Compute live rating from reviews; fall back to seed_rating for restaurants with none
                $rests = $pdo->query("
                    SELECT r.*,
                           ROUND(COALESCE(AVG(rev.rating), r.seed_rating), 1) AS rating
                    FROM restaurants r
                    LEFT JOIN reviews rev ON rev.restaurant_id = r.id
                    GROUP BY r.id
                    ORDER BY r.id DESC
                ")->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $rests]);
            } elseif ($method === 'POST') {
                $id = $_GET['id'] ?? 0;
                $input = !empty($_POST) ? $_POST : $data;

                $imageUrl = $input['image_url'] ?? '';

                // Handle Image Upload
                if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                    $uploadDir = '../pictures/restaurants/';
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0777, true);
                    }

                    $fileTmpPath = $_FILES['image']['tmp_name'];
                    $fileName   = $_FILES['image']['name'];
                    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                    $newFileName = uniqid('rest_') . '.' . $fileExtension;
                    $destPath    = $uploadDir . $newFileName;

                    if (move_uploaded_file($fileTmpPath, $destPath)) {
                        $imageUrl = '../pictures/restaurants/' . $newFileName;
                    }
                }

                if ($id) {
                    // Update — write to seed_rating (computed rating is derived at query time)
                    $stmt = $pdo->prepare("UPDATE restaurants SET name=?, description=?, cuisine=?, location=?, price_range=?, seed_rating=?, opening_time=?, closing_time=?, image_url=?, icon=?, image_gradient=? WHERE id=?");
                    $stmt->execute([
                        $input['name'], $input['description'], $input['cuisine'], $input['location'],
                        $input['price_range'], $input['seed_rating'] ?? $input['rating'] ?? null,
                        $input['opening_time'], $input['closing_time'],
                        $imageUrl, $input['icon'] ?? 'fa-utensils', $input['image_gradient'] ?? '', $id
                    ]);
                } else {
                    // Create
                    $stmt = $pdo->prepare("INSERT INTO restaurants (name, description, cuisine, location, price_range, seed_rating, opening_time, closing_time, image_url, icon, image_gradient) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([
                        $input['name'], $input['description'], $input['cuisine'], $input['location'],
                        $input['price_range'], $input['seed_rating'] ?? $input['rating'] ?? null,
                        $input['opening_time'], $input['closing_time'],
                        $imageUrl, $input['icon'] ?? 'fa-utensils', $input['image_gradient'] ?? ''
                    ]);
                }
                echo json_encode(['success' => true]);
            } elseif ($method === 'PUT') {
                // Backward-compatible PUT (no file upload)
                $id = $_GET['id'] ?? 0;
                $stmt = $pdo->prepare("UPDATE restaurants SET name=?, description=?, cuisine=?, location=?, price_range=?, seed_rating=?, opening_time=?, closing_time=?, image_url=? WHERE id=?");
                $stmt->execute([
                    $data['name'], $data['description'], $data['cuisine'], $data['location'],
                    $data['price_range'], $data['seed_rating'] ?? $data['rating'] ?? null,
                    $data['opening_time'], $data['closing_time'],
                    $data['image_url'] ?? '', $id
                ]);
                echo json_encode(['success' => true]);
            } elseif ($method === 'DELETE') {
                $id = $_GET['id'] ?? 0;
                $stmt = $pdo->prepare("DELETE FROM restaurants WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
            }
            break;

        case 'tables':
            if ($method === 'GET') {
                $restId = $_GET['restaurant_id'] ?? 0;
                if ($restId) {
                    // Compute live availability: a table is 'occupied' if it has an active
                    // reservation within 90 minutes of the current time today
                    $stmt = $pdo->prepare("
                        SELECT t.*,
                               CASE WHEN r.id IS NOT NULL THEN 'occupied' ELSE 'available' END AS status
                        FROM `tables` t
                        LEFT JOIN reservations r
                            ON r.table_id = t.id
                            AND r.date = CURDATE()
                            AND ABS(TIMESTAMPDIFF(MINUTE, r.time, CURTIME())) < 90
                            AND r.status != 'cancelled'
                        WHERE t.restaurant_id = ?
                        ORDER BY t.table_number ASC
                    ");
                    $stmt->execute([$restId]);
                    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode(['success' => true, 'data' => $tables]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'restaurant_id required']);
                }
            } elseif ($method === 'POST') {
                // status column has been removed — availability is computed at query time
                $stmt = $pdo->prepare("INSERT INTO `tables` (restaurant_id, table_number, capacity, shape, x_pos, y_pos) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['restaurant_id'], $data['table_number'], $data['capacity'],
                    $data['shape'], $data['x_pos'], $data['y_pos']
                ]);
                echo json_encode(['success' => true, 'id' => (int)$pdo->lastInsertId()]);
            } elseif ($method === 'PUT') {
                $id = $_GET['id'] ?? 0;
                $stmt = $pdo->prepare("UPDATE `tables` SET table_number=?, capacity=?, shape=?, x_pos=?, y_pos=? WHERE id=?");
                $stmt->execute([
                    $data['table_number'], $data['capacity'], $data['shape'],
                    $data['x_pos'], $data['y_pos'], $id
                ]);
                echo json_encode(['success' => true]);
            } elseif ($method === 'DELETE') {
                $id = $_GET['id'] ?? 0;
                $stmt = $pdo->prepare("DELETE FROM `tables` WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
            }
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid endpoint']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
}
