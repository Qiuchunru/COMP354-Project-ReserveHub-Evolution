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

if (!$data || empty($data->token)) {
    echo json_encode(['success' => false, 'message' => 'Invalid social login request. Token missing.']);
    exit;
}

$email = '';
$name = '';
$provider = $data->provider; // 'google' or 'facebook'
$token = $data->token;

if ($provider === 'google') {
    // ── Verify Google Token ──────────────────────────
    $verifyUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" . $token;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $verifyUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $info = json_decode($response, true);
    curl_close($ch);

    // Verify client ID (aud) to prevent cross-app attacks
    $google_client_id = "883807509960-bg31ba8sicarhupujk7c9if3dg29ifro.apps.googleusercontent.com";
    if (isset($info['error']) || $info['aud'] !== $google_client_id) {
        echo json_encode(['success' => false, 'message' => 'Invalid Google token. Verification failed.']);
        exit;
    }
    
    $email = $info['email'];
    $name = $info['name'];
} elseif ($provider === 'facebook') {
    // ── Verify Facebook Token ────────────────────────
    $verifyUrl = "https://graph.facebook.com/me?fields=id,name,email&access_token=" . $token;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $verifyUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $info = json_decode($response, true);
    curl_close($ch);

    if (isset($info['error']) || empty($info['email'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid Facebook token. Verification failed.']);
        exit;
    }
    
    $email = $info['email'];
    $name = $info['name'];
} else {
    echo json_encode(['success' => false, 'message' => 'Unsupported login provider.']);
    exit;
}

try {
    // 1. Check if user exists by email
    $stmt = $pdo->prepare("SELECT id, username, name, email, role, phone, profile_picture FROM users WHERE email = ?");
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
        $base_username = strtolower(explode('@', $email)[0]);
        $username = $base_username . rand(100, 999);
        
        // Check if username exists, if so, keep trying
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
        $checkStmt->execute([$username]);
        while ($checkStmt->fetchColumn() > 0) {
            $username = $base_username . rand(1000, 9999);
            $checkStmt->execute([$username]);
        }
        
        // Generate a random password (social users don't need it, but DB might require it)
        $password = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
        
        try {
            $insertStmt = $pdo->prepare("INSERT INTO users (username, name, email, password) VALUES (?, ?, ?, ?)");
            $insertStmt->execute([$username, $name, $email, $password]);
            $newUserId = $pdo->lastInsertId();
        } catch (PDOException $e) {
            error_log("Social Login Insert Error: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Failed to create account: ' . $e->getMessage()]);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Account created via ' . ucfirst($provider),
            'user' => [
                'id' => $newUserId,
                'username' => $username,
                'name' => $name,
                'email' => $email,
                'role' => 'user',
                'phone' => '',
                'profile_picture' => null
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
