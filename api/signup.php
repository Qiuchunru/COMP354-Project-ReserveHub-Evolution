<?php
// api/signup.php
header('Content-Type: application/json');

require_once 'db.php';

// Get JSON data
$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid data format.']);
    exit;
}

$username_val = trim($data->username ?? '');
$name = trim($data->name ?? '');
$email = trim($data->email ?? '');
$phone = trim($data->phone ?? '');
$password = trim($data->password ?? '');

// Basic validation
if (empty($username_val) || empty($name) || empty($email) || empty($password) || empty($phone)) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all fields.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters.']);
    exit;
}

try {
    // Check if username or email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
    $stmt->execute([$email, $username_val]);
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => false, 'message' => 'Email or Username is already registered.']);
        exit;
    }

    // Hash password and insert
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("INSERT INTO users (username, name, email, phone, password) VALUES (?, ?, ?, ?, ?)");
    if ($stmt->execute([$username_val, $name, $email, $phone, $hashed_password])) {
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful!'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Something went wrong during registration.'
        ]);
    }
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
