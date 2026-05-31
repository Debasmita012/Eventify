// Central API configuration
// In production, set VITE_API_URL environment variable to your backend URL
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API = rawApiUrl.replace(/\/+$/, '');

export default API;
