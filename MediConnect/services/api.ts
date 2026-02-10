import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Load base URL from environment variable
// Load base URL from environment variable or use fallback
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.10.6:8000/api";

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn("⚠️ EXPO_PUBLIC_API_URL not found in .env. Using fallback:", API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, 
});

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRedirecting = false;

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Token Expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRedirecting) return Promise.reject(error);

      originalRequest._retry = true;

      try {
        console.log("🔄 Access token expired. Attempting refresh...");
        const refreshToken = await SecureStore.getItemAsync('refresh_token');

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call the refresh endpoint
        // NOTE: We use axios directly to avoid interceptor loop
        const res = await axios.post(`${API_URL}/users/token/refresh/`, {
           refresh: refreshToken
        });

        const newAccessToken = res.data.access;
        
        if (newAccessToken) {
          console.log("✅ Token Refreshed Successfully");
          await SecureStore.setItemAsync('access_token', newAccessToken);
          
          // Update default headers
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          
          // Retry original request
          return api(originalRequest);
        }

      } catch (refreshError) {
        console.error('❌ Token Refresh Failed:', refreshError);
        handleLogout();
      }
    }

    // Standard Error Logging
    if (error.response) {
      // If 401 and we failed retry (re-entered here via handleLogout or just failed), prevent duplicate alerts if possible
      // But logging is fine
       console.error('Backend Error:', error.response.data);
    } else if (error.request) {
      console.error('Network Error - Server not reachable.');
    } else {
      console.error('Error Message:', error.message);
    }

    return Promise.reject(error);
  }
);

async function handleLogout() {
  if (isRedirecting) return;
  isRedirecting = true;
  
  console.warn('Session expired. Redirecting to login...');
  
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
  await SecureStore.deleteItemAsync('user_role');
  await SecureStore.deleteItemAsync('user_id');
  
  const { router } = require('expo-router');
  router.replace('/(auth)/login');
  
  setTimeout(() => { isRedirecting = false; }, 3000);
}

export default api;