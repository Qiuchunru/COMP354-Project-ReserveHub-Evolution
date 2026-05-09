<?php
// api/social_login.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput);

if (!$data || empty($data->email)) {
    echo json_encode(['success' => false, 'message' => 'Invalid social login data.']);
    exit;
}

$email = trim($data->email);
$name = trim($data->name);
$provider = $data->provider; // 'google' or 'facebook'
$social_id = $data->id;

try {
    // 1. Check if user exists by email
    $stmt = $pdo->prepare("SELECT id, username, name, email, phone FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // User exists, log them in
        echo json_encode([
            'success' => true,
            'message' => 'Login successful!',
            'user' => $user
        ]);
    } else {
        // 2. Create new user
        // Generate a unique username from email
        $username = strtolower(explode('@', $email)[0]) . rand(100, 999);
        
        // Generate a random password (social users don't need it, but DB might require it)
        $password = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
        
        $insertStmt = $pdo->prepare("INSERT INTO users (username, name, email, password) VALUES (?, ?, ?, ?)");
        $insertStmt->execute([$username, $name, $email, $password]);
        
        $newUserId = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => 'Account created via ' . ucfirst($provider),
            'user' => [
                'id' => $newUserId,
                'username' => $username,
                'name' => $name,
                'email' => $email,
                'phone' => ''
            ]
        ]);
    }
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
