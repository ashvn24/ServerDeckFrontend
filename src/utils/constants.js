const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocalhost ? 'http://localhost:8000/api' : 'https://api.serverdeck.online/api';
export const WS_URL = isLocalhost ? 'ws://localhost:8000/ws/client' : 'wss://api.serverdeck.online/ws/client';
