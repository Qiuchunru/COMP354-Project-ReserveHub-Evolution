<?php
session_start();
// api/db.php
// Auto-detects environment: uses local XAMPP credentials when running on localhost,
// and InfinityFree credentials when running on the live server.

$isLocal = in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1', '::1', ''])
        || ($_SERVER['SERVER_ADDR'] ?? '') === '127.0.0.1'
        || ($_SERVER['HTTP_HOST'] ?? '') === 'localhost';

if ($isLocal) {
    // ── Local XAMPP ──────────────────────────────
    $host    = 'localhost';
    $db      = 'reserve-hub';   // your local database name
    $user    = 'root';
    $pass    = '';             // default XAMPP has no root password
} else {
    // ── InfinityFree (Production) ─────────────────
    $host = 'sql101.infinityfree.com';
    $db   = 'if0_41799227_reservehub';
    $user = 'if0_41799227';
    $pass = 'Sekolah1123';
}

$charset = 'utf8mb4';
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    die(json_encode(['success' => false, 'message' => 'Database Connection Failed: ' . $e->getMessage()]));
}
?>
