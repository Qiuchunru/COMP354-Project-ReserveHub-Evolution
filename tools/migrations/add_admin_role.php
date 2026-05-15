<?php
// api/add_admin_role.php
require_once 'db.php';

try {
    $pdo->exec("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' AFTER email");
    echo "Column 'role' added successfully!";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column 'role' already exists.";
    } else {
        echo "Error: " . $e->getMessage();
    }
}
?>
