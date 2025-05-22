// Configuration for the frontend application
const config = {
    // API URLs
    development: {
        apiUrl: 'http://localhost:3000'
    },
    production: {
        apiUrl: 'https://calendar-backend-8aqw.onrender.com'  // Render backend URL
    }
};

// Determine if we're in development or production
const environment = window.location.hostname === 'localhost' ? 'development' : 'production';

// Export the configuration for the current environment
export const currentConfig = config[environment]; 