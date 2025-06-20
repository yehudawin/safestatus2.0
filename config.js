// SafeStatus Configuration
class Config {
    constructor() {
        // Detect if we're in development or production
        this.isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('localhost');
        
        // API Base URL
        this.apiUrl = this.isDevelopment 
            ? 'http://localhost:8000'  // Development
            : window.location.origin;  // Production (same domain)
        
        // API endpoints
        this.endpoints = {
            sendOtp: `${this.apiUrl}/api/send-otp`,
            verifyOtp: `${this.apiUrl}/api/verify-otp`,
            updateStatus: `${this.apiUrl}/api/status`,
            getStatus: (phone) => `${this.apiUrl}/api/status/${phone}`,
            debug: `${this.apiUrl}/debug/users`
        };
        
        // App settings
        this.settings = {
            // OTP settings
            otpLength: 6,
            otpTestCode: this.isDevelopment ? '123456' : null,
            
            // Status refresh interval (milliseconds)
            statusRefreshInterval: 30000, // 30 seconds
            
            // Contact sync settings
            maxContacts: 100,
            
            // PWA settings
            enableNotifications: true,
            enableOfflineMode: true,
            
            // UI settings
            animationDuration: 300,
            toastDuration: 5000,
            
            // Security
            sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
            
            // Features flags
            features: {
                contacts: false,        // Not implemented yet
                realTimeUpdates: false, // Not implemented yet
                pushNotifications: false // Not implemented yet
            }
        };
        
        console.log(`🚀 SafeStatus Config loaded:`, {
            environment: this.isDevelopment ? 'Development' : 'Production',
            apiUrl: this.apiUrl,
            features: this.settings.features
        });
    }
    
    // Get API URL for specific endpoint
    getApiUrl(endpoint) {
        return this.endpoints[endpoint] || `${this.apiUrl}/api/${endpoint}`;
    }
    
    // Check if feature is enabled
    isFeatureEnabled(feature) {
        return this.settings.features[feature] || false;
    }
    
    // Get app version info
    getVersionInfo() {
        return {
            version: '1.0.0',
            buildDate: '2025-06-20',
            environment: this.isDevelopment ? 'development' : 'production'
        };
    }
}

// Global configuration instance
window.SafeStatusConfig = new Config(); 