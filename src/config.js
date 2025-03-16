export const API_URL = import.meta.env.PROD 
  ? 'https://api.interviewhelper.in/api' 
  : (import.meta.env.PUBLIC_API_URL || 'http://localhost:5500/api');
