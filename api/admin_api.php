<?php
header('Content-Type: application/json');
require_once 'db.php';

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
                $rests = $pdo->query("SELECT * FROM restaurants ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $rests]);
            } elseif ($method === 'POST') {
                $stmt = $pdo->prepare("INSERT INTO restaurants (name, description, cuisine, location, price_range, rating, opening_time, closing_time, image_gradient, image_url, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['name'], $data['description'], $data['cuisine'], $data['location'], 
                    $data['price_range'], $data['rating'], $data['opening_time'], $data['closing_time'], 
                    $data['image_gradient'] ?? '', $data['image_url'] ?? '', $data['icon'] ?? 'fa-utensils'
                ]);
                echo json_encode(['success' => true]);
            } elseif ($method === 'PUT') {
                $id = $_GET['id'] ?? 0;
                $stmt = $pdo->prepare("UPDATE restaurants SET name=?, description=?, cuisine=?, location=?, price_range=?, rating=?, opening_time=?, closing_time=?, image_gradient=?, image_url=?, icon=? WHERE id=?");
                $stmt->execute([
                    $data['name'], $data['description'], $data['cuisine'], $data['location'], 
                    $data['price_range'], $data['rating'], $data['opening_time'], $data['closing_time'], 
                    $data['image_gradient'] ?? '', $data['image_url'] ?? '', $data['icon'] ?? 'fa-utensils', $id
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
                    $stmt = $pdo->prepare("SELECT * FROM `tables` WHERE restaurant_id = ? ORDER BY table_number ASC");
                    $stmt->execute([$restId]);
                    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode(['success' => true, 'data' => $tables]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'restaurant_id required']);
                }
            } elseif ($method === 'POST') {
                $stmt = $pdo->prepare("INSERT INTO `tables` (restaurant_id, table_number, capacity, shape, x_pos, y_pos, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['restaurant_id'], $data['table_number'], $data['capacity'], $data['shape'], 
                    $data['x_pos'], $data['y_pos'], $data['status']
                ]);
                echo json_encode(['success' => true]);
            } elseif ($method === 'PUT') {
                $id = $_GET['id'] ?? 0;
                $stmt = $pdo->prepare("UPDATE `tables` SET table_number=?, capacity=?, shape=?, x_pos=?, y_pos=?, status=? WHERE id=?");
                $stmt->execute([
                    $data['table_number'], $data['capacity'], $data['shape'], 
                    $data['x_pos'], $data['y_pos'], $data['status'], $id
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
