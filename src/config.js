export const API_URL = import.meta.env.PROD 
  ? 'https://api.interviewhelper.in/api' 
  : (import.meta.env.PUBLIC_API_URL || 'http://localhost:5500/api');

// Google Analytics 4 Configuration
export const GA_MEASUREMENT_ID = import.meta.env.PUBLIC_GA_MEASUREMENT_ID || '';
