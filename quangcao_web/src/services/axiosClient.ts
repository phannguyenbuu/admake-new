import axios from 'axios';
import { TOKEN_LABEL } from '../common/config';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_HOST,
  headers: {
    'Content-Type': 'application/json',
  },
});
axiosClient.interceptors.request.use(
  (config) => {
    // Add any request interceptors here, e.g., adding auth tokens
    const token = localStorage.getItem(TOKEN_LABEL);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
    },
    (error) => {
      // Handle request errors here
      return Promise.reject(error);
    }
);
axiosClient.interceptors.response.use(
  (response) => {
    // Handle successful responses here
    return response.data;
    },
    (error) => {
        // Handle response errors here
        return Promise.reject(error);
    }
);

export default axiosClient;
