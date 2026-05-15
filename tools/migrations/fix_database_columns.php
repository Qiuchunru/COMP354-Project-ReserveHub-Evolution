<?php
// api/fix_database_columns.php
require_once 'db.php';

try {
    echo "Checking and fixing database columns...<br>";

    // 1. Add username column
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN username VARCHAR(50) DEFAULT NULL AFTER id");
        echo "Column 'username' added successfully!<br>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "Column 'username' already exists.<br>";
        } else {
            throw $e;
        }
    }

    // 2. Add profile_picture column
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) DEFAULT NULL AFTER phone");
        echo "Column 'profile_picture' added successfully!<br>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "Column 'profile_picture' already exists.<br>";
        } else {
            throw $e;
        }
    }

    echo "Database sync complete!";
} catch (PDOException $e) {
    echo "Critical Error: " . $e->getMessage();
}
?>
