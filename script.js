// SafeStatus App - Main JavaScript

class SafeStatusApp {
    constructor() {
        this.currentUser = null;
        this.currentScreen = 'login';
        // Get config from global configuration
        this.config = window.SafeStatusConfig;
        this.init();
    }

    init() {
        this.checkExistingLogin();
        this.bindEvents();
        console.log('SafeStatus App initialized');
    }

    // בדיקה אם יש התחברות קיימת
    checkExistingLogin() {
        const savedUser = localStorage.getItem('safestatus_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.showScreen('main');
                this.loadUserData();
            } catch (e) {
                localStorage.removeItem('safestatus_user');
            }
        }
    }

    // ניהול אירועים
    bindEvents() {
        // Login events
        document.getElementById('send-otp')?.addEventListener('click', () => this.sendOTP());
        document.getElementById('verify-otp')?.addEventListener('click', () => this.verifyOTP());
        
        // Main app events
        document.getElementById('update-btn')?.addEventListener('click', () => this.showStatusModal());
        document.getElementById('close-modal')?.addEventListener('click', () => this.hideStatusModal());
        
        // Status selection
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.updateStatus(e.target.dataset.status));
        });
        
        // Navigation (מבוטל לעת עתה - נוסיף מאוחר יותר)
        // document.querySelectorAll('.nav-btn').forEach(btn => {
        //     btn.addEventListener('click', (e) => this.navigate(e.target.dataset.screen));
        // });
    }

    // שליחת OTP (מצב טסט)
    async sendOTP() {
        const phoneInput = document.getElementById('phone-input');
        const phone = phoneInput.value.trim();
        
        if (!this.validatePhone(phone)) {
            alert('אנא הזן מספר טלפון תקין');
            return;
        }

        // מצב טסט - מציג את שלב ה-OTP ישירות
        console.log('Sending OTP to:', phone);
        document.getElementById('phone-step').style.display = 'none';
        document.getElementById('otp-step').style.display = 'block';
        
        // במצב אמיתי נשלח בקשה לשרת:
        // try {
        //     const response = await fetch(`${this.API_BASE}/send-otp`, {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({ phone })
        //     });
        //     if (response.ok) {
        //         // success
        //     }
        // } catch (error) {
        //     console.error('Error sending OTP:', error);
        // }
    }

    // אימות OTP (מצב טסט)
    async verifyOTP() {
        const otpInput = document.getElementById('otp-input');
        const otp = otpInput.value.trim();
        const phoneInput = document.getElementById('phone-input');
        const phone = phoneInput.value.trim();
        
        if (otp.length !== 6) {
            alert('אנא הזן קוד בן 6 ספרות');
            return;
        }

        // מצב טסט - מקבל כל קוד
        console.log('Verifying OTP:', otp, 'for phone:', phone);
        
        // יצירת משתמש זמני
        this.currentUser = {
            phone: phone,
            status: 'no-update',
            lastUpdate: null,
            joinDate: new Date().toISOString()
        };
        
        // שמירה ב-localStorage
        localStorage.setItem('safestatus_user', JSON.stringify(this.currentUser));
        
        // מעבר למסך הראשי
        this.showScreen('main');
        this.loadUserData();
        
        // במצב אמיתי נשלח בקשה לשרת:
        // try {
        //     const response = await fetch(`${this.API_BASE}/verify-otp`, {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({ phone, otp })
        //     });
        //     if (response.ok) {
        //         const user = await response.json();
        //         this.currentUser = user;
        //         localStorage.setItem('safestatus_user', JSON.stringify(user));
        //         this.showScreen('main');
        //     }
        // } catch (error) {
        //     console.error('Error verifying OTP:', error);
        // }
    }

    // ולידציה למספר טלפון
    validatePhone(phone) {
        return /^05\d{8}$/.test(phone);
    }

    // הצגת מסך
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = screenName === 'main' ? 'main-screen' : `${screenName}-screen`;
        const screen = document.getElementById(targetScreen);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenName;
        }
    }

    // טעינת נתוני משתמש
    loadUserData() {
        if (!this.currentUser) return;
        
        // עדכון מצב נוכחי
        this.updateMyStatusDisplay();
        
        // טעינת חברים (מדמה)
        this.loadFriends();
    }

    // עדכון תצוגת המצב שלי
    updateMyStatusDisplay() {
        const statusElement = document.getElementById('my-status');
        if (!statusElement) return;
        
        const statusTexts = {
            'shelter': 'במקלט',
            'safe': 'בטוח',
            'no-update': 'לא עודכן'
        };
        
        const statusColors = {
            'shelter': 'text-shelter',
            'safe': 'text-safe',
            'no-update': 'text-gray-400'
        };
        
        const status = this.currentUser.status || 'no-update';
        statusElement.textContent = statusTexts[status];
        statusElement.className = statusColors[status];
    }

    // הצגת מודל עדכון מצב
    showStatusModal() {
        document.getElementById('status-modal').style.display = 'block';
    }

    // הסתרת מודל עדכון מצב
    hideStatusModal() {
        document.getElementById('status-modal').style.display = 'none';
    }

    // עדכון מצב
    async updateStatus(newStatus) {
        if (!this.currentUser) return;
        
        console.log('Updating status to:', newStatus);
        
        // עדכון מקומי
        this.currentUser.status = newStatus;
        this.currentUser.lastUpdate = new Date().toISOString();
        localStorage.setItem('safestatus_user', JSON.stringify(this.currentUser));
        
        // עדכון תצוגה
        this.updateMyStatusDisplay();
        this.hideStatusModal();
        
        // במצב אמיתי נשלח לשרת:
        // try {
        //     await fetch(`${this.API_BASE}/status`, {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({
        //             phone: this.currentUser.phone,
        //             status: newStatus
        //         })
        //     });
        // } catch (error) {
        //     console.error('Error updating status:', error);
        // }
    }

    // טעינת חברים (מדמה לעת עתה)
    loadFriends() {
        // במצב אמיתי נטען מהשרת
        console.log('Loading friends...');
        
        // נתונים דמיים לבדיקה
        const mockFriends = [];
        
        if (mockFriends.length === 0) {
            // אין חברים - מציג הודעה
            document.getElementById('friends-list').innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fa-solid fa-users text-3xl mb-2"></i>
                    <p>אין חברים עדיין</p>
                    <button class="mt-4 bg-shelter px-4 py-2 rounded-lg" onclick="alert('תכונה בפיתוח')">
                        הוסף חברים
                    </button>
                </div>
            `;
        }
    }

    // התנתקות
    logout() {
        localStorage.removeItem('safestatus_user');
        this.currentUser = null;
        this.showScreen('login');
        
        // איפוס טפסים
        document.getElementById('phone-input').value = '';
        document.getElementById('otp-input').value = '';
        document.getElementById('phone-step').style.display = 'block';
        document.getElementById('otp-step').style.display = 'none';
    }
}

// יצירת האפליקציה כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    window.safeStatusApp = new SafeStatusApp();
});

// פונקציות גלובליות לדיבוג
window.debugApp = {
    getUser: () => window.safeStatusApp?.currentUser,
    logout: () => window.safeStatusApp?.logout(),
    updateStatus: (status) => window.safeStatusApp?.updateStatus(status)
}; 