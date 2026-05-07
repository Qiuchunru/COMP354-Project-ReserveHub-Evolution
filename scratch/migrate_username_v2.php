<?php
$configs = [
    ['host' => 'localhost', 'user' => 'root', 'pass' => '', 'db' => 'reservehub'],
    ['host' => 'localhost', 'user' => 'root', 'pass' => '', 'db' => 'reserve-hub'],
    ['host' => 'localhost', 'user' => 'root', 'pass' => 'root', 'db' => 'reservehub'],
    ['host' => 'localhost', 'user' => 'root', 'pass' => 'root', 'db' => 'reserve-hub']
];

foreach ($configs as $config) {
    try {
        $dsn = "mysql:host={$config['host']};dbname={$config['db']};charset=utf8";
        $pdo = new PDO($dsn, $config['user'], $config['pass']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        echo "Connected to {$config['db']} successfully.\n";
        
        $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'username'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE AFTER name");
            echo "Column 'username' added to {$config['db']}.\n";
        } else {
            echo "Column 'username' already exists in {$config['db']}.\n";
        }
        exit;
    } catch (PDOException $e) {
        echo "Failed to connect to {$config['db']}: " . $e->getMessage() . "\n";
    }
}
?>
