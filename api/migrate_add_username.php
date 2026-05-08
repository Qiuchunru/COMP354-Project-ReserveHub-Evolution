<?php
// api/migrate_add_username.php
// Adds 'username' column to the users table on whichever DB is active.
// Run via browser on production: https://yourdomain/reservehub/api/migrate_add_username.php
// Run via browser on local:      http://localhost/reservehub/api/migrate_add_username.php

header('Content-Type: text/plain');

require_once 'db.php'; // uses auto-detect for local vs production

$results = [];

try {
    // ── username column ──────────────────────────────────────────────────
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'username'");
    if ($stmt->rowCount() > 0) {
        $results[] = "✅ Column 'username' already exists — no changes made.";
    } else {
        $pdo->exec("ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE NULL AFTER id");
        $results[] = "✅ Added 'username' column to users table.";

        // Backfill existing rows so NOT NULL constraint can be applied
        $pdo->exec("UPDATE users SET username = CONCAT('user_', id) WHERE username IS NULL");
        $results[] = "✅ Backfilled existing users with default usernames (user_1, user_2, …).";

        $pdo->exec("ALTER TABLE users MODIFY COLUMN username VARCHAR(50) UNIQUE NOT NULL");
        $results[] = "✅ Set 'username' column to NOT NULL.";
    }

    // ── phone column ─────────────────────────────────────────────────────
    $stmt2 = $pdo->query("SHOW COLUMNS FROM users LIKE 'phone'");
    if ($stmt2->rowCount() === 0) {
        $pdo->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER email");
        $results[] = "✅ Added 'phone' column to users table.";
    } else {
        $results[] = "✅ Column 'phone' already exists — no changes made.";
    }

    $results[] = "\nMigration complete. You can delete this file now.";

} catch (PDOException $e) {
    $results[] = "❌ Error: " . $e->getMessage();
}

echo implode("\n", $results) . "\n";
?>
