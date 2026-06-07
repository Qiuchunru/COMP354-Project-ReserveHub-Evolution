<?php
// api/make_me_admin.php
require_once 'db.php';

$email = $_GET['email'] ?? '';

if (empty($email)) {
    die("Error: Please provide an email address in the URL. Example: make_me_admin.php?email=test@example.com");
}

try {
    $stmt = $pdo->prepare("UPDATE users SET role = 'admin' WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->rowCount() > 0) {
        echo "<div style='font-family: sans-serif; padding: 20px; background: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 8px;'>";
        echo "<strong>Success!</strong> The account <strong>$email</strong> has been promoted to <strong>Admin</strong>.";
        echo "<br><br><a href='../html/index.html' style='color: #155724; font-weight: bold;'>Back to Home</a>";
        echo "</div>";
    } else {
        echo "<div style='font-family: sans-serif; padding: 20px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 8px;'>";
        echo "<strong>Error:</strong> No user found with email <strong>$email</strong>. Please check the email and try again.";
        echo "</div>";
    }
} catch (PDOException $e) {
    die("Database Error: " . $e->getMessage());
}
?>
