<?php
// api/upload_avatar.php
header('Content-Type: application/json');
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

if (!isset($_FILES['avatar']) || !isset($_POST['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing file or user ID.']);
    exit;
}

$user_id = $_POST['user_id'];
$file = $_FILES['avatar'];

// 1. Validate File
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPG, PNG, and WEBP are allowed.']);
    exit;
}

if ($file['size'] > 2 * 1024 * 1024) { // 2MB limit
    echo json_encode(['success' => false, 'message' => 'File is too large. Max size is 2MB.']);
    exit;
}

// 2. Prepare Upload Path
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$fileName = 'user_' . $user_id . '_' . time() . '.' . $extension;
$uploadDir = '../uploads/profile_pics/';
$uploadPath = $uploadDir . $fileName;

// 3. Move File
if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
    try {
        // Get old picture to delete it later
        $stmt = $pdo->prepare("SELECT profile_picture FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $oldPic = $stmt->fetchColumn();

        // Update Database
        $stmt = $pdo->prepare("UPDATE users SET profile_picture = ? WHERE id = ?");
        $stmt->execute([$fileName, $user_id]);

        // Delete old picture if it exists and is not the same
        if ($oldPic && file_exists($uploadDir . $oldPic)) {
            unlink($uploadDir . $oldPic);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Profile picture updated successfully!',
            'profile_picture' => $fileName
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file.']);
}
?>
