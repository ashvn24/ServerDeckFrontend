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
  move: (id, folderId) => client.patch(`/servers/${id}/move?folder_id=${folderId || ''}`),
  getInstallCommand: (id) => client.get(`/servers/${id}/install-command`),
};

// Folders
export const foldersAPI = {
  list: () => client.get('/folders/'),
  create: (data) => client.post('/folders/', data),
  delete: (id) => client.delete(`/folders/${id}`),
  move: (id, parentId) => client.patch(`/folders/${id}/move?parent_id=${parentId || ''}`),
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

// Users
export const usersAPI = {
  list: () => client.get('/users/'),
  invite: (data) => client.post('/users/invite', data),
  directCreate: (data) => client.post('/users/direct', data),
  getInviteDetails: (token) => client.get(`/users/invite-details/${token}`),
  acceptInvite: (data) => client.post('/users/accept-invite', data),
  delete: (id) => client.delete(`/users/${id}`),
};
