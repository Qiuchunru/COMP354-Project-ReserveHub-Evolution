<?php
// api/db.php (InfinityFree Configuration Template)
// Replace the placeholders with your actual credentials from the InfinityFree Client Area.

$host = 'sql101.infinityfree.com'; // Your MySQL Hostname
$db   = 'if0_41799227_reservehub'; // Your MySQL Database Name
$user = 'if0_41799227';            // Your MySQL Username
$pass = 'Sekolah1123';            // Your MySQL Password
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
    // In production, don't show the full error to users
    die("Database Connection Failed. Please check your credentials.");
}
?>
