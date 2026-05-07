<?php
require_once 'api/db.php';

try {
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'username'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE AFTER name");
        echo "Column 'username' added successfully.\n";
    } else {
        echo "Column 'username' already exists.\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
