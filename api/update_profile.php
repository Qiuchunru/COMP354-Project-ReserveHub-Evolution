<?php
// api/update_profile.php
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->user_id) || empty($data->name)) {
    echo json_encode(['success' => false, 'message' => 'User ID and Name are required.']);
    exit;
}

$user_id = $data->user_id;
$name = trim($data->name);
$username = trim($data->username ?? '');
$phone = trim($data->phone ?? '');

try {
    // 1. Check if username is already taken by another user
    if (!empty($username)) {
        $checkStmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
        $checkStmt->execute([$username, $user_id]);
        if ($checkStmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Username is already taken.']);
            exit;
        }
    }

    // 2. Update user info
    $stmt = $pdo->prepare("UPDATE users SET name = ?, username = ?, phone = ? WHERE id = ?");
    $result = $stmt->execute([$name, $username, $phone, $user_id]);

    if ($result) {
        // Fetch updated user data
        $stmt = $pdo->prepare("SELECT id, username, name, email, role, phone, profile_picture FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully!',
            'user' => $user
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update profile.']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
