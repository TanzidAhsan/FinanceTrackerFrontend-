/**
 * API Configuration
 * Dynamically determines the backend URL based on environment or window location
 */

// Get backend URL from multiple sources in order of priority:
// 1. Environment variable REACT_APP_API_URL
// 2. Window location (auto-detect if running on same domain)
// 3. Default to localhost:5000

const getApiUrl = () => {
  // Check if environment variable is set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Auto-detect: if frontend is on custom domain/IP, assume backend is on same domain/IP
  // This works when both frontend and backend are deployed together
  if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const backendPort = process.env.REACT_APP_BACKEND_PORT || "5000";
    return `${protocol}//${hostname}:${backendPort}/api`;
  }

  // Default for localhost development
  return "http://localhost:5000/api";
};

export const API_BASE_URL = getApiUrl();

export default API_BASE_URL;
