<?php
// api/reserve.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$user_id        = $_SESSION['user_id'];
$restaurant_id  = $data['restaurant_id'] ?? null;
$table_id       = $data['table_id'] ?? null;
$date           = $data['date'] ?? null;
$reservation_time = $data['time'] ?? null;
$guest_count    = $data['guests'] ?? null;
$special_req    = $data['special_requests'] ?? '';

if (!$user_id || !$restaurant_id || !$table_id || !$date || !$reservation_time || !$guest_count) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// ── Helper: convert "HH:MM:SS" or "HH:MM" to total minutes ──────────────────
function timeToMinutes(string $t): int {
    $parts = explode(':', $t);
    return (int)$parts[0] * 60 + (int)($parts[1] ?? 0);
}

// ── Helper: check if a requested time falls within operating hours ────────────
function isWithinOperatingHours(string $requestedTime, string $openTime, string $closeTime): bool {
    $req   = timeToMinutes($requestedTime);
    $open  = timeToMinutes($openTime);
    $close = timeToMinutes($closeTime);

    // 24-hour restaurant (00:00 – 23:59)
    if ($open === 0 && $close >= 1439) {
        return true;
    }

    if ($close > $open) {
        // Normal same-day span: e.g. 11:00 – 22:00
        return $req >= $open && $req < $close;
    } else {
        // Overnight span: e.g. 18:00 – 03:00
        return $req >= $open || $req < $close;
    }
}

try {
    // ── Operating hours check ────────────────────────────────────────────────
    $hoursStmt = $pdo->prepare(
        "SELECT opening_time, closing_time FROM `restaurants` WHERE restaurant_id = ?"
    );
    $hoursStmt->execute([$restaurant_id]);
    $hours = $hoursStmt->fetch(PDO::FETCH_ASSOC);

    if ($hours && $hours['opening_time'] && $hours['closing_time']) {
        if (!isWithinOperatingHours($reservation_time, $hours['opening_time'], $hours['closing_time'])) {
            $open  = substr($hours['opening_time'],  0, 5);
            $close = substr($hours['closing_time'], 0, 5);
            echo json_encode([
                'success' => false,
                'closed'  => true,
                'message' => "Cannot reserve — the restaurant is closed at this time. Operating hours: {$open} – {$close}.",
            ]);
            exit;
        }
    }
    // ── End operating hours check ────────────────────────────────────────────

    // Check if table is still available at this time
    $checkStmt = $pdo->prepare("
        SELECT booking_id FROM reservations 
        WHERE table_id = ? AND date = ? AND status IN ('pending', 'confirmed')
        AND ABS(TIMESTAMPDIFF(MINUTE, reservation_time, ?)) < 60
    ");
    $checkStmt->execute([$table_id, $date, $reservation_time]);
    if ($checkStmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'This table has just been reserved. Please choose another.']);
        exit;
    }

    // Check table capacity vs guests
    $tableStmt = $pdo->prepare("SELECT capacity FROM `tables` WHERE table_id = ?");
    $tableStmt->execute([$table_id]);
    $tableRow = $tableStmt->fetch(PDO::FETCH_ASSOC);
    if (!$tableRow) {
        echo json_encode(['success' => false, 'message' => 'Table not found.']);
        exit;
    }
    if ($guest_count > $tableRow['capacity']) {
        echo json_encode(['success' => false, 'message' => "This table seats up to {$tableRow['capacity']} guests."]);
        exit;
    }

    // Generate new alphanumeric ID
    $idStmt = $pdo->query("SELECT COALESCE(MAX(CAST(SUBSTRING(booking_id, 2) AS UNSIGNED)), 0) + 1 FROM reservations");
    $next_id = $idStmt->fetchColumn();
    $new_booking_id = 'b' . str_pad($next_id, 3, '0', STR_PAD_LEFT);

    // Insert reservation
    $stmt = $pdo->prepare(
        "INSERT INTO reservations (booking_id, customer_id, restaurant_id, table_id, date, reservation_time, guest_count, special_requests, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
    );
    $stmt->execute([$new_booking_id, $user_id, $restaurant_id, $table_id, $date, $reservation_time, $guest_count, $special_req]);

    echo json_encode([
        'success' => true,
        'message' => 'Reservation request submitted and is awaiting approval!',
        'reservation_id' => $new_booking_id
    ]);
} catch (PDOException $e) {
    // Gracefully handle foreign key constraint violations (e.g. invalid restaurant_id)
    if ($e->getCode() == 23000) {
        echo json_encode(['success' => false, 'message' => 'Invalid restaurant or table selection.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
?>
