<?php
// api/export.php
// Admin-only endpoint: streams all reservation records as a downloadable CSV.
//
// Auth model matches api/admin_api.php: requires a logged-in session whose
// role is 'admin'. session_start() is provided by db.php.
//
// Usage: GET /api/export.php  (while logged in as an admin)

require_once 'db.php';

// --- Authorization: administrators only -----------------------------------
// Note: db.php calls session_start(), so $_SESSION is available here.
if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'admin') {
    // Respond as JSON so the failure is readable if hit via fetch/XHR.
    header('Content-Type: application/json');
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized: admin access required.']);
    exit;
}

// --- Query reservation data -----------------------------------------------
// No user input is interpolated into this query, but we use a prepared
// statement per the security requirement. The JOINs mirror the existing
// admin "reservations" endpoint so column semantics stay consistent.
try {
    $stmt = $pdo->prepare("
        SELECT
            res.booking_id       AS reservation_id,
            u.name               AS user_name,
            r.name               AS restaurant_name,
            res.date             AS reservation_date,
            res.reservation_time AS reservation_time,
            res.guest_count      AS guests,
            res.status           AS status
        FROM reservations res
        JOIN users u        ON res.customer_id   = u.user_id
        JOIN restaurants r  ON res.restaurant_id = r.restaurant_id
        ORDER BY res.date DESC, res.reservation_time DESC
    ");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Export query failed: ' . $e->getMessage()]);
    exit;
}

// --- Send CSV download headers --------------------------------------------
// A timestamped filename keeps repeated exports from overwriting each other.
$filename = 'reservations_export_' . date('Y-m-d_His') . '.csv';

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Pragma: no-cache');
header('Expires: 0');

// --- Write CSV to the output stream ---------------------------------------
$output = fopen('php://output', 'w');

// UTF-8 BOM so Excel opens accented characters (e.g. café) correctly.
fprintf($output, "\xEF\xBB\xBF");

// Human-readable column headers.
fputcsv($output, [
    'Reservation ID',
    'User Name',
    'Restaurant',
    'Date',
    'Time',
    'Guests',
    'Status',
]);

// Data rows.
foreach ($rows as $row) {
    fputcsv($output, [
        $row['reservation_id'],
        $row['user_name'],
        $row['restaurant_name'],
        $row['reservation_date'],
        $row['reservation_time'],
        $row['guests'],
        $row['status'],
    ]);
}

fclose($output);
exit;
