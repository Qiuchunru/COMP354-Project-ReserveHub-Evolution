<?php
/**
 * ReserveHub - Environment Diagnostic Tool
 * Location: /tools/env_check.php
 */

// Terminal color codes
$colorGreen = "\033[32m";
$colorYellow = "\033[33m";
$colorRed = "\033[31m";
$colorReset = "\033[0m";

echo "--- ReserveHub Environment Check ---\n";

// 1. Check PHP Version
$phpVersion = phpversion();
$isPhpOk = version_compare($phpVersion, '7.4.0', '>=');
$status = $isPhpOk ? "{$colorGreen}[OK]{$colorReset}" : "{$colorYellow}[WARNING]{$colorReset}";
echo "PHP Version: $phpVersion $status\n";
if (!$isPhpOk) echo "  -> Error: Project requires PHP 7.4.0 or higher.\n";

// 2. Check PDO MySQL Extension
$hasPdo = extension_loaded('pdo_mysql');
$status = $hasPdo ? "{$colorGreen}[OK]{$colorReset}" : "{$colorRed}[ERROR]{$colorReset}";
echo "PDO MySQL Extension: $status\n";
if (!$hasPdo) echo "  -> Error: pdo_mysql extension is required for database connectivity.\n";

// 3. Check Directory Permissions
$uploadDir = dirname(__DIR__) . '/uploads';
$dirExists = is_dir($uploadDir);
$isWritable = $dirExists && is_writable($uploadDir);
$status = $isWritable ? "{$colorGreen}[OK]{$colorReset}" : "{$colorRed}[ERROR]{$colorReset}";
echo "Uploads Directory Writable: $status\n";
if (!$dirExists) echo "  -> Error: Directory '$uploadDir' does not exist.\n";
elseif (!$isWritable) echo "  -> Error: Directory '$uploadDir' is not writable.\n";

// 4. Check Database Connection
echo "Database Connection: ";
try {
    // Automatically path back to root /api/db.php
    require_once dirname(__DIR__) . '/api/db.php';
    
    // Check if $pdo instance exists
    if (isset($pdo) && $pdo instanceof PDO) {
        echo "{$colorGreen}[OK]{$colorReset}\n";
    } else {
        throw new Exception("PDO object not found in db.php.");
    }
} catch (Exception $e) {
    echo "{$colorRed}[ERROR]{$colorReset} -> " . $e->getMessage() . "\n";
}

echo "--- Check Complete ---\n";