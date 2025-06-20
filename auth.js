// SafeStatus Authentication Module

class AuthManager {
    constructor() {
        this.apiUrl = 'http://localhost:8000';
        this.currentStep = 'phone';
        this.currentPhone = '';
        this.init();
    }

    init() {
        // Check if user is already logged in
        if (this.isLoggedIn()) {
            window.location.href = 'home.html';
            return;
        }
        
        this.setupEventListeners();
        this.focusPhoneInput();
    }

    setupEventListeners() {
        // Main action button
        const authActionBtn = document.getElementById('auth-action-btn');
        const phoneInput = document.getElementById('phone-number');
        const otpInput = document.getElementById('otp-code');
        const resendOtpBtn = document.getElementById('resend-otp-btn');
        const completeSetupBtn = document.getElementById('complete-setup-btn');
        
        if (authActionBtn) {
            authActionBtn.addEventListener('click', () => this.handleAuthAction());
        }
        
        if (resendOtpBtn) {
            resendOtpBtn.addEventListener('click', () => this.sendOtp());
        }
        
        if (completeSetupBtn) {
            completeSetupBtn.addEventListener('click', () => this.completeSetup());
        }
        
        // Enter key handling
        if (phoneInput) {
            phoneInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleAuthAction();
            });
            phoneInput.addEventListener('input', () => this.validatePhoneInput());
        }
        
        if (otpInput) {
            otpInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleAuthAction();
            });
            otpInput.addEventListener('input', () => this.validateOtpInput());
        }
    }

    focusPhoneInput() {
        const phoneInput = document.getElementById('phone-number');
        if (phoneInput) {
            setTimeout(() => phoneInput.focus(), 100);
        }
    }

    validatePhoneInput() {
        const phoneInput = document.getElementById('phone-number');
        const authActionBtn = document.getElementById('auth-action-btn');
        
        if (!phoneInput || !authActionBtn) return;
        
        const phone = phoneInput.value.trim();
        const isValid = this.validatePhone(phone);
        
        if (isValid) {
            authActionBtn.disabled = false;
            authActionBtn.classList.remove('opacity-50');
            phoneInput.classList.remove('border-red-500');
        } else {
            authActionBtn.disabled = true;
            authActionBtn.classList.add('opacity-50');
        }
    }

    validateOtpInput() {
        const otpInput = document.getElementById('otp-code');
        const authActionBtn = document.getElementById('auth-action-btn');
        
        if (!otpInput || !authActionBtn) return;
        
        const otp = otpInput.value.trim();
        const isValid = otp.length === 6 && /^\d{6}$/.test(otp);
        
        if (isValid) {
            authActionBtn.disabled = false;
            authActionBtn.classList.remove('opacity-50');
            otpInput.classList.remove('border-red-500');
        } else {
            authActionBtn.disabled = true;
            authActionBtn.classList.add('opacity-50');
        }
    }

    showLoading(text = 'טוען...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        if (overlay && loadingText) {
            loadingText.textContent = text;
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    handleAuthAction() {
        if (this.currentStep === 'phone') {
            this.sendOtp();
        } else if (this.currentStep === 'verification') {
            this.verifyOtp();
        }
    }

    showVerificationStep() {
        const verificationInput = document.getElementById('verification-input');
        const authActionBtn = document.getElementById('auth-action-btn');
        
        if (verificationInput) {
            verificationInput.classList.remove('hidden');
        }
        
        if (authActionBtn) {
            authActionBtn.textContent = 'אמת קוד';
            authActionBtn.className = 'w-full bg-safe py-4 rounded-lg text-lg font-bold hover:bg-green-600 transition-colors';
        }
        
        this.currentStep = 'verification';
        
        // Focus on OTP input
        const otpInput = document.getElementById('otp-code');
        if (otpInput) {
            setTimeout(() => otpInput.focus(), 100);
        }
    }

    showProfileSetup() {
        const loginForm = document.getElementById('login-form');
        const profileSetup = document.getElementById('profile-setup');
        
        if (loginForm) {
            loginForm.classList.add('hidden');
        }
        
        if (profileSetup) {
            profileSetup.classList.remove('hidden');
        }
        
        this.currentStep = 'profile';
        
        // Focus on name input
        const nameInput = document.querySelector('#name-input input');
        if (nameInput) {
            setTimeout(() => nameInput.focus(), 100);
        }
    }

    validatePhone(phone) {
        // Remove spaces and dashes
        const cleanPhone = phone.replace(/[-\s]/g, '');
        
        // Check if it's a valid Israeli mobile number
        const phoneRegex = /^05\d{8}$/;
        return phoneRegex.test(cleanPhone);
    }

    formatPhone(phone) {
        // Remove any non-digit characters
        return phone.replace(/\D/g, '');
    }

    async sendOtp() {
        const phoneInput = document.getElementById('phone-number');
        if (!phoneInput) return;
        
        const phone = phoneInput.value.trim();
        
        if (!phone) {
            this.showError('אנא הזן מספר טלפון');
            phoneInput.focus();
            return;
        }
        
        if (!this.validatePhone(phone)) {
            this.showError('מספר טלפון לא תקין. אנא הזן מספר בפורמט 050-123-4567');
            phoneInput.classList.add('border-red-500');
            phoneInput.focus();
            return;
        }
        
        const formattedPhone = this.formatPhone(phone);
        
        try {
            this.showLoading('שולח קוד אימות...');
            
            const config = window.SafeStatusConfig;
            const response = await fetch(config.endpoints.sendOtp, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: formattedPhone })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Store phone for verification
                this.currentPhone = formattedPhone;
                
                // Update phone display
                const phoneDisplayText = document.getElementById('phone-display-text');
                if (phoneDisplayText) {
                    phoneDisplayText.textContent = `שלחנו קוד אימות ל-${this.formatPhoneDisplay(formattedPhone)}`;
                }
                
                this.showVerificationStep();
                
            } else {
                const error = await response.json();
                this.showError(error.detail || 'שגיאה בשליחת קוד האימות');
            }
            
        } catch (error) {
            console.error('Error sending OTP:', error);
            this.showError('שגיאת רשת. אנא בדוק את החיבור לאינטרנט');
        } finally {
            this.hideLoading();
        }
    }
    
    async verifyOtp() {
        const otpInput = document.getElementById('otp-code');
        if (!otpInput) return;
        
        const otp = otpInput.value.trim();
        
        if (!otp) {
            this.showError('אנא הזן קוד אימות');
            otpInput.focus();
            return;
        }
        
        if (otp.length !== 6) {
            this.showError('קוד האימות חייב להכיל 6 ספרות');
            otpInput.classList.add('border-red-500');
            otpInput.focus();
            return;
        }
        
        try {
            this.showLoading('מאמת קוד...');
            
            const config = window.SafeStatusConfig;
            const response = await fetch(config.endpoints.verifyOtp, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    phone: this.currentPhone, 
                    otp: otp 
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Store auth token and user data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userPhone', this.currentPhone);
                localStorage.setItem('loginTime', new Date().toISOString());
                
                // Check if this is a new user
                if (data.is_new_user || !localStorage.getItem('profileComplete')) {
                    this.showProfileSetup();
                } else {
                    // Redirect to home page
                    this.showSuccess('התחברת בהצלחה! מעביר לאפליקציה...');
                    setTimeout(() => {
                        window.location.href = 'home.html';
                    }, 1500);
                }
                
            } else {
                const error = await response.json();
                this.showError(error.detail || 'קוד אימות שגוי');
                otpInput.classList.add('border-red-500');
                otpInput.focus();
            }
            
        } catch (error) {
            console.error('Error verifying OTP:', error);
            this.showError('שגיאת רשת. אנא בדוק את החיבור לאינטרנט');
        } finally {
            this.hideLoading();
        }
    }
    
    async completeSetup() {
        const nameInput = document.querySelector('#name-input input');
        const locationInput = document.querySelector('#location-input input');
        const emergencyContactInput = document.querySelector('#emergency-contact input');
        
        const name = nameInput ? nameInput.value.trim() : '';
        const location = locationInput ? locationInput.value.trim() : '';
        const emergencyContact = emergencyContactInput ? emergencyContactInput.value.trim() : '';
        
        if (!name) {
            this.showError('אנא הזן שם מלא');
            if (nameInput) {
                nameInput.classList.add('border-red-500');
                nameInput.focus();
            }
            return;
        }
        
        try {
            this.showLoading('שומר פרטים...');
            
            // Store profile data locally for now
            localStorage.setItem('userName', name);
            localStorage.setItem('userLocation', location);
            localStorage.setItem('emergencyContact', emergencyContact);
            localStorage.setItem('profileComplete', 'true');
            
            // In a real app, you would send this to the server
            // await this.updateUserProfile({ name, location, emergencyContact });
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showSuccess('הגדרת הפרופיל הושלמה בהצלחה!');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error completing setup:', error);
            this.showError('שגיאה בשמירת הפרטים');
        } finally {
            this.hideLoading();
        }
    }
    
    formatPhoneDisplay(phone) {
        // Format phone for display: 0501234567 -> 050-123-4567
        if (phone.length === 10) {
            return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
        }
        return phone;
    }
    
    showError(message) {
        this.showAlert(message, 'error');
    }
    
    showSuccess(message) {
        this.showAlert(message, 'success');
    }
    
    showAlert(message, type) {
        // Remove existing alerts
        const existingAlert = document.getElementById('alert-message');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        // Create new alert
        const alert = document.createElement('div');
        alert.id = 'alert-message';
        alert.className = `fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-lg text-white max-w-md text-center ${
            type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`;
        
        alert.innerHTML = `<i class="fa-solid fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'} ml-2"></i>${message}`;
        
        document.body.appendChild(alert);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
    
    isLoggedIn() {
        const token = localStorage.getItem('authToken');
        const phone = localStorage.getItem('userPhone');
        return !!(token && phone);
    }
    
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('userName');
        localStorage.removeItem('userLocation');
        localStorage.removeItem('emergencyContact');
        localStorage.removeItem('profileComplete');
        window.location.href = 'login.html';
    }
    
    getCurrentUser() {
        return {
            phone: localStorage.getItem('userPhone'),
            token: localStorage.getItem('authToken'),
            loginTime: localStorage.getItem('loginTime'),
            name: localStorage.getItem('userName'),
            location: localStorage.getItem('userLocation'),
            emergencyContact: localStorage.getItem('emergencyContact'),
            profileComplete: localStorage.getItem('profileComplete')
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Debug utilities
window.debugAuth = {
    getStoredUser: () => {
        return {
            token: localStorage.getItem('authToken'),
            phone: localStorage.getItem('userPhone'),
            name: localStorage.getItem('userName'),
            profileComplete: localStorage.getItem('profileComplete')
        };
    },
    clearAuth: () => {
        localStorage.clear();
        location.reload();
    },
    testLogin: (phone = '0501234567') => {
        localStorage.setItem('authToken', 'test-token');
        localStorage.setItem('userPhone', phone);
        localStorage.setItem('loginTime', new Date().toISOString());
        localStorage.setItem('profileComplete', 'true');
        window.location.href = 'home.html';
    }
}; 