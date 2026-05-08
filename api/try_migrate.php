<?php
$configs = [
    ['host' => 'localhost', 'db' => 'reservehub', 'user' => 'root', 'pass' => ''],
    ['host' => 'localhost', 'db' => 'if0_41799227_reservehub', 'user' => 'root', 'pass' => ''],
];

foreach ($configs as $c) {
    try {
        $pdo = new PDO("mysql:host={$c['host']};dbname={$c['db']}", $c['user'], $c['pass']);
        $pdo->exec("ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) AFTER image_gradient");
        echo "Success with {$c['db']} on {$c['host']}\n";
        exit;
    } catch (Exception $e) {
        // Continue
    }
}
echo "Failed to connect to any local DB\n";
?>
