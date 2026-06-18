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
$role = trim($data->role ?? 'customer');

if (!in_array($role, ['customer', 'vendor'])) {
    $role = 'customer';
}

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
    $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ? OR username = ?");
    $stmt->execute([$email, $username_val]);
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => false, 'message' => 'Email or Username is already registered.']);
        exit;
    }

    // Hash password
    $hashed_password = $password;
    
    // Generate new alphanumeric user_id
    $idStmt = $pdo->query("SELECT COALESCE(MAX(CAST(SUBSTRING(user_id, 2) AS UNSIGNED)), 0) + 1 FROM users");
    $next_id = $idStmt->fetchColumn();
    $new_id = 'c' . str_pad($next_id, 3, '0', STR_PAD_LEFT);
    
    $stmt = $pdo->prepare("INSERT INTO users (user_id, username, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)");
    if ($stmt->execute([$new_id, $username_val, $name, $email, $phone, $hashed_password, $role])) {
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
