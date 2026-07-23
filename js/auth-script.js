// Stores the current translations.
let authTranslations = {};

function t(key, fallback, vars = {}) {
    let text = authTranslations[key] || fallback;
    Object.keys(vars).forEach(varKey => {
        text = text.replace(`{${varKey}}`, vars[varKey]);
    });
    return text;
}

// Listen for global language changes
window.addEventListener('reservehub:languageChanged', event => {
    authTranslations = event?.detail?.translations || {};
});

// Form Switching
function switchForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const forms = [loginForm, signupForm, forgotPasswordForm];

    forms.forEach(form => {
        if (form) form.classList.remove('active');
    });

    if (formType === 'login') {
        loginForm.classList.add('active');
    } else if (formType === 'signup') {
        signupForm.classList.add('active');
    } else if (formType === 'forgotPassword') {
        if (forgotPasswordForm) forgotPasswordForm.classList.add('active');
    }
}

// Toggle Password Visibility
function togglePassword(fieldId, buttonEl) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Use passed element or current event target
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

// Check Password Strength
function checkPasswordStrength(password) {
    const strengthBar = document.getElementById('passwordStrength');

    if (!strengthBar) return;

    strengthBar.classList.remove('weak', 'fair', 'strong');

    if (password.length < 6) {
        strengthBar.classList.add('weak');
    } else if (password.length < 10) {
        if (/[A-Z]/.test(password) && /[0-9]/.test(password)) {
            strengthBar.classList.add('strong');
        } else {
            strengthBar.classList.add('fair');
        }
    } else {
        if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) {
            strengthBar.classList.add('strong');
        } else if (/[A-Z]/.test(password) || /[0-9]/.test(password)) {
            strengthBar.classList.add('fair');
        } else {
            strengthBar.classList.add('weak');
        }
    }
}

// Validate Email
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Validate Password
function validatePassword(password) {
    return password.length >= 6;
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

// Login Form Submission
document.getElementById('loginFormElement')?.addEventListener('submit', function (e) {
    e.preventDefault();

    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;

    let isValid = true;

    // Clear previous errors
    clearError('loginIdentifierError');
    clearError('loginPasswordError');

    // Validate identifier
    if (!identifier) {
        showError('loginIdentifierError', t('auth.validation.identifierRequired', 'Email or Username is required'));
        isValid = false;
    }

    // Validate password
    if (!password) {
        showError('loginPasswordError', t('auth.validation.passwordRequired', 'Password is required'));
        isValid = false;
    } else if (!validatePassword(password)) {
        showError('loginPasswordError', t('auth.validation.passwordMin', 'Password must be at least 6 characters'));
        isValid = false;
    }

    if (isValid) {
        const userData = {
            identifier: identifier,
            password: password
        };

        const submitBtn = this.querySelector('.submit-btn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span>${t('auth.login.loading', 'Signing In...')}</span>`;
        submitBtn.disabled = true;

        fetch('../api/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
            .then(response => response.json())
            .then(data => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;

                if (data.success) {
                    if (rememberMe) {
                        localStorage.setItem('reservehub_user', JSON.stringify({
                            id: data.user.id,
                            username: data.user.username,
                            email: data.user.email,
                            name: data.user.name,
                            role: data.user.role,
                            phone: data.user.phone,
                            role: data.user.role,
                            timestamp: new Date().toISOString()
                        }));
                    } else {
                        sessionStorage.setItem('reservehub_user', JSON.stringify({
                            id: data.user.id,
                            username: data.user.username,
                            email: data.user.email,
                            name: data.user.name,
                            role: data.user.role,
                            phone: data.user.phone,
                            role: data.user.role,
                            timestamp: new Date().toISOString()
                        }));
                    }

                    showSuccessModal(
                        t('auth.success.loginTitle', 'Login Successful!'),
                        t('auth.success.loginMessage', 'Welcome back, {name}!').replace('{name}', data.user.name)
                    );
                    this.reset();
                    setTimeout(() => {
                        if (data.user.role === 'admin') {
                            window.location.href = 'admin.html';
                        } else if (data.user.role === 'vendor') {
                            window.location.href = 'vendor-dashboard.html';
                        } else {
                            window.location.href = 'index.html';
                        }
                    }, 2000);
                } else {
                    showError('loginPasswordError', data.message);
                }
            })
            .catch(error => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                showError('loginPasswordError', t('auth.validation.network', 'Network error. Please try again later.'));
                console.error('Error:', error);
            });
    }
});

// Signup Form Submission
document.getElementById('signupFormElement')?.addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('signupUsername').value.trim();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const agreeTerms = document.getElementById('agreeTerms').checked;
    const registerAsVendor = document.getElementById('registerAsVendor')?.checked || false;

    let isValid = true;

    // Clear previous errors
    clearError('signupUsernameError');
    clearError('signupNameError');
    clearError('signupEmailError');
    clearError('signupPhoneError');
    clearError('signupPasswordError');
    clearError('confirmPasswordError');
    clearError('agreeTermsError');

    // Validate username
    if (!username) {
        showError('signupUsernameError', t('auth.validation.usernameRequired', 'Username is required'));
        isValid = false;
    } else if (username.length < 3) {
        showError('signupUsernameError', t('auth.validation.usernameMin', 'Username must be at least 3 characters'));
        isValid = false;
    }

    // Validate name
    if (!name) {
        showError('signupNameError', t('auth.validation.nameRequired', 'Name is required'));
        isValid = false;
    } else if (name.length < 3) {
        showError('signupNameError', t('auth.validation.nameMin', 'Name must be at least 3 characters'));
        isValid = false;
    }

    // Validate email
    if (!email) {
        showError('signupEmailError', t('auth.validation.emailRequired', 'Email is required'));
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('signupEmailError', t('auth.validation.emailInvalid', 'Please enter a valid email'));
        isValid = false;
    }

    // Validate phone
    if (!phone) {
        showError('signupPhoneError', t('auth.validation.phoneRequired', 'Phone number is required'));
        isValid = false;
    } else if (phone.length < 8) {
        showError('signupPhoneError', t('auth.validation.phoneInvalid', 'Please enter a valid phone number'));
        isValid = false;
    }

    // Validate password
    if (!password) {
        showError('signupPasswordError', t('auth.validation.passwordRequired', 'Password is required'));
        isValid = false;
    } else if (!validatePassword(password)) {
        showError('signupPasswordError', t('auth.validation.passwordMin', 'Password must be at least 6 characters'));
        isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
        showError('confirmPasswordError', t('auth.validation.confirmRequired', 'Please confirm your password'));
        isValid = false;
    } else if (password !== confirmPassword) {
        showError('confirmPasswordError', t('auth.validation.passwordMismatch', 'Passwords do not match'));
        isValid = false;
    }

    // Validate terms
    if (!agreeTerms) {
        showError('agreeTermsError', t('auth.validation.termsRequired', 'You must agree to the terms and privacy policy'));
        isValid = false;
    }

    if (isValid) {
        const userData = {
            username: username,
            name: name,
            email: email,
            phone: phone,
            password: password,
            role: registerAsVendor ? 'vendor' : 'customer'
        };

        const submitBtn = this.querySelector('.submit-btn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span>${t('auth.signup.loading', 'Creating Account...')}</span>`;
        submitBtn.disabled = true;

        fetch('../api/signup.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
            .then(response => response.json())
            .then(data => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;

                if (data.success) {
                    showSuccessModal(
                        t('auth.success.signupTitle', 'Account Created!'),
                        t('auth.success.signupMessage', 'Welcome {name}! Your account has been created successfully.').replace('{name}', name)
                    );
                    this.reset();
                    setTimeout(() => {
                        switchForm('login');
                    }, 2000);
                } else {
                    showError('signupEmailError', data.message);
                }
            })
            .catch(error => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                showError('signupPasswordError', t('auth.validation.network', 'Network error. Please try again later.'));
                console.error('Error:', error);
            });
    }
});

// Forgot Password Form Submission
document.getElementById('forgotPasswordFormElement')?.addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('resetEmail').value.trim();
    let isValid = true;

    clearError('resetEmailError');

    if (!email) {
        showError('resetEmailError', t('auth.validation.emailRequired', 'Email is required'));
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('resetEmailError', t('auth.validation.emailInvalid', 'Please enter a valid email'));
        isValid = false;
    }

    if (isValid) {
        const submitBtn = this.querySelector('.submit-btn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span>${t('auth.reset.loading', 'Sending Link...')}</span>`;
        submitBtn.disabled = true;

        // Make API call to send reset link
        fetch('../api/forgot_password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        })
            .then(response => response.json())
            .then(data => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;

                if (data.success) {
                    let successMessage = data.message || t('auth.success.resetMessage', "We've sent a password reset link to {email}").replace('{email}', email);
                    if (data.debug_link) {
                        successMessage += `<br><br><div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px; font-size: 0.9em; word-break: break-all; text-align: left;"><strong>${t('auth.success.devModeLabel', '[Dev Mode] Reset Link:')}</strong><br><a href="${data.debug_link}" style="color: #00b4db; text-decoration: underline;">${data.debug_link}</a></div>`;
                    }
                    showSuccessModal(t('auth.success.resetTitle', 'Reset Link Sent!'), successMessage);
                    this.reset();
                    setTimeout(() => {
                        switchForm('login');
                    }, 3000);
                } else {
                    showError('resetEmailError', data.message || t('auth.validation.resetFailed', 'Failed to send reset link. Please try again.'));
                }
            })
            .catch(error => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                showError('resetEmailError', t('auth.validation.network', 'Network error. Please try again later.'));
                console.error('Error:', error);
            });
    }
});

// Show Success Modal
function showSuccessModal(title, message) {
    const modal = document.getElementById('successModal');
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successText').innerHTML = message;
    modal.classList.add('show');

    // Auto-close after 3 seconds
    setTimeout(() => {
        modal.classList.remove('show');
    }, 3000);
}

// Social Login Integration
function socialLogin(provider) {
    if (provider === 'google') {
        googleLogin();
    } else if (provider === 'facebook') {
        facebookLogin();
    }
}

// Google Login Implementation
window.addEventListener('load', () => {
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: "883807509960-bg31ba8sicarhupujk7c9if3dg29ifro.apps.googleusercontent.com",
            callback: handleGoogleResponse
        });
        
        // Replace custom buttons with official Google icon buttons to avoid One Tap cooldown blocks
        document.querySelectorAll('.social-btn.google').forEach(btn => {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'inline-block';
            wrapper.style.verticalAlign = 'top';
            btn.parentNode.replaceChild(wrapper, btn);
            
            google.accounts.id.renderButton(wrapper, {
                type: 'icon',
                shape: 'circle',
                theme: 'outline',
                size: 'large'
            });
        });
    }
});

function googleLogin() {
    // Deprecated: Button is now rendered natively by Google
    console.warn('Click intercepted by Google iframe. If you see this, native render failed.');
}

function handleGoogleResponse(response) {
    if (response.credential) {
        // Decode the JWT (simplistic client-side decoding for UI, backend must verify)
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));

        processSocialLogin({
            provider: 'google',
            token: response.credential,
            email: payload.email,
            name: payload.name,
            id: payload.sub
        });
    }
}

// Facebook Login Implementation
function facebookLogin() {
    FB.login(function (response) {
        if (response.status === 'connected') {
            FB.api('/me', { fields: 'name,email' }, function (userData) {
                processSocialLogin({
                    provider: 'facebook',
                    token: response.authResponse.accessToken,
                    email: userData.email,
                    name: userData.name,
                    id: userData.id
                });
            });
        }
    }, { scope: 'public_profile,email' });
}

// Unified Social Login Processor
function processSocialLogin(data) {
    const loginForm = document.getElementById('loginFormElement');
    const submitBtn = loginForm?.querySelector('.submit-btn');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';

    if (!data.email) {
        console.error('Social Login Error: No email provided by ' + data.provider);
        showToast(t('auth.social.noEmail', 'Could not retrieve your email from {provider}. Please make sure your email is verified and public.').replace('{provider}', data.provider), 'error');
        return;
    }

    if (submitBtn) {
        submitBtn.innerHTML = `<span>${t('auth.social.processing', 'Processing...')}</span>`;
        submitBtn.disabled = true;
    }

    fetch('../api/social_login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => {
            if (!res.ok) {
                throw new Error('Server returned ' + res.status + ': ' + res.statusText);
            }
            return res.json();
        })
        .then(res => {
            if (res.success) {
                localStorage.setItem('reservehub_user', JSON.stringify({
                    id: res.user.id,
                    username: res.user.username,
                    email: res.user.email,
                    name: res.user.name,
                    role: res.user.role,
                    phone: res.user.phone,
                    role: res.user.role,
                    timestamp: new Date().toISOString()
                }));

                showSuccessModal(
                    t('auth.success.loginTitle', 'Login Successful!'),
                    t('auth.success.socialWelcome', 'Welcome, {name}!').replace('{name}', res.user.name)
                );
                setTimeout(() => {
                    if (res.user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else if (res.user.role === 'vendor') {
                        window.location.href = 'vendor-dashboard.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 2000);
            } else {
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                }
                showToast(res.message || t('auth.social.failed', 'Social login failed. Please try again.'), 'error');
            }
        })
        .catch(err => {
            console.error('Social Login Error:', err);
            if (submitBtn) {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
}

// Input validation on blur
const inputs = document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
inputs.forEach(input => {
    input.addEventListener('blur', function () {
        // Clear error on blur for better UX
        const errorId = this.id + 'Error';
        const errorElement = document.getElementById(errorId);
        if (errorElement && this.value.trim()) {
            clearError(errorId);
        }
    });
});

// Prevent form submission on Enter in social buttons
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
    });
});

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('reservehub_user');
    if (user && window.location.pathname.includes('login-signup')) {
        console.log('User already logged in:', user);
    }
});
