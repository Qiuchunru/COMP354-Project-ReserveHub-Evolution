<?php
// api/forgot_password.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';
require_once 'load_env.php';

// Get JSON data from request body
$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput);

// Fallback: try $_POST if JSON decode failed
if (!$data && !empty($_POST)) {
    $data = (object) $_POST;
}

if (!$data || empty($data->email)) {
    echo json_encode(['success' => false, 'message' => 'Email is required.']);
    exit;
}

$email = trim($data->email);

try {
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id, name FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Generate a secure token
        $token = bin2hex(random_bytes(32));
        
        // Set expiry time to 1 hour from now
        $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

        // Save token to database
        $updateStmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?");
        $updateStmt->execute([$token, $expiry, $user['id']]);

        // Create the reset link
        $isLocal = in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1', '::1', ''])
            || ($_SERVER['SERVER_ADDR'] ?? '') === '127.0.0.1'
            || ($_SERVER['HTTP_HOST'] ?? '') === 'localhost';
            
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $baseDir = $isLocal ? '/reservehub' : '';
        $resetLink = $protocol . '://' . $host . $baseDir . '/html/reset-password.html?token=' . $token;

        // Send email using PHPMailer
        require_once 'PHPMailer/Exception.php';
        require_once 'PHPMailer/PHPMailer.php';
        require_once 'PHPMailer/SMTP.php';

        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';                     // Set the SMTP server to send through
            $mail->SMTPAuth   = true;                                 // Enable SMTP authentication
            $mail->Username   = $_ENV['SMTP_USER'];       // SMTP username
            $mail->Password   = $_ENV['SMTP_PASS'];                  // SMTP password (use an App Password)
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS; 
            $mail->Port       = 587;                                  // TCP port to connect to

            // Recipients
            $mail->setFrom($_ENV['SMTP_USER'], 'ReserveHub Team');
            $mail->addAddress($email, $user['name']);                 // Add a recipient

            // Content
            $mail->isHTML(false);
            $mail->Subject = "Password Reset Request - ReserveHub";
            $message = "Hi " . $user['name'] . ",\n\n";
            $message .= "We received a request to reset your ReserveHub password.\n";
            $message .= "Click the link below to set a new password:\n\n";
            $message .= $resetLink . "\n\n";
            $message .= "If you didn't request this, you can safely ignore this email.\nThis link will expire in 1 hour.\n\n";
            $message .= "Best regards,\nThe ReserveHub Team";
            $mail->Body = $message;

            $mail->send();
        } catch (Exception $e) {
            error_log("Message could not be sent. Mailer Error: {$mail->ErrorInfo}");
        }
    }
    
    // Always return success even if email doesn't exist to prevent email enumeration
    echo json_encode([
        'success' => true,
        'message' => 'If an account matches that email, we have sent a password reset link.'
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
