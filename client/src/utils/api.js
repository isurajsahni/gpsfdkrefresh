import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'https://gpsfdkrefresh.onrender.com/api';
if (!baseURL.endsWith('/api')) {
  baseURL += '/api';
}

const API = axios.create({
  baseURL,
});

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
