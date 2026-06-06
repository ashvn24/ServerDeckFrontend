import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request — read fresh from localStorage each time.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('serverdeck_token');
  // Guard against a token that was persisted as the literal string "undefined"/
  // "null" (still truthy → would send `Bearer undefined` and 403 with hasToken=true).
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers = config.headers || {};
    // axios >= 1.x uses an AxiosHeaders instance (set()); older builds use a
    // plain object. Handle both so the header is reliably attached everywhere,
    // including iOS standalone PWA.
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('serverdeck_token');
      localStorage.removeItem('serverdeck_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
