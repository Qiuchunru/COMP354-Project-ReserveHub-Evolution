// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
let resetTranslations = {};

// Returns a translated string for a given key.
function rt(key, fallback) {
    return resetTranslations[key] || fallback;
}

// Listen for global language changes
window.addEventListener('reservehub:languageChanged', (event) => {
    resetTranslations = event.detail?.translations || {};
});

if (token) {
    document.getElementById('resetToken').value = token;
} else {
    showError('newPasswordError', rt('reset.dynamic.error.invalidToken', 'Invalid or missing reset token.'));
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) submitBtn.disabled = true;
}

// Toggle password visibility
function toggleResetPassword(fieldId, buttonEl) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const button = buttonEl || (event && (event.currentTarget || event.target.closest('button')));
    if (!button) return;
    const icon = button.querySelector('i');
    if (!icon) return;

    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Show Error Message
function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

// Clear Error Message
function clearError(fieldId) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = '';
    }
}

// Show Success Modal
function showSuccessModal(title, message) {
    const modal = document.getElementById('successModal');
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successText').textContent = message;
    modal.classList.add('show');
}

// Input validation on blur
const inputs = document.querySelectorAll('input[type="password"]');
inputs.forEach(input => {
    input.addEventListener('blur', function () {
        const errorId = this.id + 'Error';
        const errorElement = document.getElementById(errorId);
        if (errorElement && this.value.trim()) {
            clearError(errorId);
        }
    });
});

// Handle Form Submit
document.getElementById('resetPasswordFormElement')?.addEventListener('submit', function (e) {
    e.preventDefault();

    const token = document.getElementById('resetToken').value;
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmNewPassword = document.getElementById('confirmNewPassword').value.trim();

    clearError('newPasswordError');
    clearError('confirmNewPasswordError');

    let isValid = true;

    if (newPassword.length < 6) {
        showError('newPasswordError', rt('reset.dynamic.error.passwordLength', 'Password must be at least 6 characters'));
        isValid = false;
    }

    if (newPassword !== confirmNewPassword) {
        showError('confirmNewPasswordError', rt('reset.dynamic.error.passwordMismatch', 'Passwords do not match'));
        isValid = false;
    }

    if (isValid) {
        const submitBtn = this.querySelector('.submit-btn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span>${rt('reset.dynamic.button.updating', 'Updating...')}</span>`;
        submitBtn.disabled = true;

        fetch('../api/reset_password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: token, newPassword: newPassword })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccessModal(rt('reset.dynamic.success.title', 'Success!'), data.message);
                setTimeout(() => {
                    window.location.href = 'login-signup.html';
                }, 3000);
            } else {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                showError('newPasswordError', data.message);
            }
        })
        .catch(error => {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            showError('newPasswordError', rt('reset.dynamic.error.network', 'Network error. Please try again.'));
        });
    }
});
