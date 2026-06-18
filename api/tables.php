<?php
// api/tables.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'db.php';

$restaurant_id = $_GET['restaurant_id'] ?? null;
$date          = $_GET['date']          ?? null;
$time          = $_GET['time']          ?? null;
$guest_count   = $_GET['guests']        ?? null;

if (!$restaurant_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid restaurant ID']);
    exit;
}

// ── Helper: convert "HH:MM:SS" or "HH:MM" to total minutes ──────────────────
function timeToMinutes(string $t): int {
    $parts = explode(':', $t);
    return (int)$parts[0] * 60 + (int)($parts[1] ?? 0);
}

// ── Helper: check if a requested time falls within operating hours ────────────
// Handles overnight spans (e.g. opening=22:00, closing=03:00).
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
    if ($date && $time && $guest_count) {

        // ── Operating hours check ────────────────────────────────────────────
        $hoursStmt = $pdo->prepare(
            "SELECT opening_time, closing_time FROM `restaurants` WHERE restaurant_id = ?"
        );
        $hoursStmt->execute([$restaurant_id]);
        $hours = $hoursStmt->fetch(PDO::FETCH_ASSOC);

        if ($hours && $hours['opening_time'] && $hours['closing_time']) {
            if (!isWithinOperatingHours($time, $hours['opening_time'], $hours['closing_time'])) {
                $open  = substr($hours['opening_time'],  0, 5);
                $close = substr($hours['closing_time'], 0, 5);
                echo json_encode([
                    'success' => false,
                    'closed'  => true,
                    'message' => "The restaurant is closed at this time. Operating hours: {$open} – {$close}.",
                    'opening_time' => $hours['opening_time'],
                    'closing_time' => $hours['closing_time'],
                ]);
                exit;
            }
        }
        // ── End operating hours check ────────────────────────────────────────

        // Compute per-table availability for a specific date/time window (±60 min)
        // Also check capacity against requested guests
        $stmt = $pdo->prepare("
            SELECT t.*,
                   CASE 
                       WHEN t.capacity < ? THEN 'unavailable'
                       WHEN r.booking_id IS NOT NULL THEN 'occupied' 
                       ELSE 'available' 
                   END AS status
            FROM `tables` t
            LEFT JOIN reservations r
                ON  r.table_id      = t.table_id
                AND r.date          = ?
                AND ABS(TIMESTAMPDIFF(MINUTE, r.reservation_time, CAST(? AS TIME))) < 60
                AND r.status IN ('pending', 'confirmed')
            WHERE t.restaurant_id = ?
            ORDER BY t.table_number
        ");
        $stmt->execute([$guest_count, $date, $time, $restaurant_id]);
    } else {
        // Just return all tables for this restaurant if no date/time/guests
        $stmt = $pdo->prepare("
            SELECT t.*, 'available' as status 
            FROM `tables` t 
            WHERE t.restaurant_id = ? 
            ORDER BY t.table_number ASC
        ");
        $stmt->execute([$restaurant_id]);
    }

    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $tables]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
