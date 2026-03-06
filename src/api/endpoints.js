import client from './client';

// Auth
export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
};

// Servers
export const serversAPI = {
  list: () => client.get('/servers/'),
  create: (data) => client.post('/servers/', data),
  get: (id) => client.get(`/servers/${id}`),
  delete: (id) => client.delete(`/servers/${id}`),
  getInstallCommand: (id) => client.get(`/servers/${id}/install-command`),
};

// Sites
export const sitesAPI = {
  list: (serverId) => client.get(`/sites/?server_id=${serverId}`),
  create: (data) => client.post('/sites/', data),
  delete: (id) => client.delete(`/sites/${id}`),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => client.get('/dashboard/'),
};

// Logs
export const logsAPI = {
  fetch: (serverId, source, name, lines = 100) =>
    client.get(`/logs/${serverId}?source=${source}&name=${name}&lines=${lines}`),
};
