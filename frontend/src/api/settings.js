/**
 * Settings API client
 * Handles all settings-related HTTP requests
 */

import { apiClient } from './client';

// Mock data for development
const mockSettings = {
  general: {
    organizationName: 'MyCompany NetOps',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    language: 'en',
    theme: 'light'
  },
  notifications: {
    emailEnabled: true,
    emailAddress: 'netops-team@mycom.com',
    slackEnabled: true,
    slackWebhook: 'https://hooks.slack.com/services/xxx/yyy/zzz',
    smsEnabled: false,
    smsNumber: '',
    alertDigestEnabled: true,
    alertDigestFrequency: 'daily',
    criticalAlertsOnly: false
  },
  monitoring: {
    defaultRefreshInterval: 30,
    dataRetentionDays: 90,
    metricsResolution: '1m',
    enableAutoDiscovery: true,
    healthCheckInterval: 60,
    snmpEnabled: true,
    snmpCommunity: 'public',
    icmpEnabled: true
  },
  security: {
    sessionTimeout: 30,
    mfaEnabled: true,
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expirationDays: 90
    },
    ipWhitelist: [],
    auditLoggingEnabled: true
  },
  api: {
    rateLimit: 1000,
    rateLimitWindow: 60,
    apiKeyRotationDays: 90,
    webhookRetries: 3,
    webhookTimeout: 30
  }
};

const mockUsers = [
  {
    id: 'user-001',
    name: 'John Admin',
    email: 'admin@mycom.com',
    role: 'admin',
    status: 'active',
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'user-002',
    name: 'Jane Operator',
    email: 'netops@mycom.com',
    role: 'operator',
    status: 'active',
    lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'user-003',
    name: 'Bob Viewer',
    email: 'viewer@mycom.com',
    role: 'viewer',
    status: 'active',
    lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'user-004',
    name: 'Alice Engineer',
    email: 'engineer@mycom.com',
    role: 'operator',
    status: 'inactive',
    lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockApiKeys = [
  {
    id: 'key-001',
    name: 'Production API Key',
    prefix: 'pk_live_xxxx',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    permissions: ['read', 'write']
  },
  {
    id: 'key-002',
    name: 'Monitoring Integration',
    prefix: 'pk_live_yyyy',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    permissions: ['read']
  },
  {
    id: 'key-003',
    name: 'CI/CD Pipeline',
    prefix: 'pk_test_zzzz',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
    permissions: ['read', 'write', 'delete']
  }
];

const mockAuditLogs = [
  {
    id: 'log-001',
    action: 'network.delete',
    user: 'admin@mycom.com',
    resource: 'Network: Test Network',
    details: 'Deleted network with ID net-test-001',
    ip: '192.168.1.100',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'log-002',
    action: 'alert.acknowledge',
    user: 'netops@mycom.com',
    resource: 'Alert: High Latency',
    details: 'Acknowledged alert alert-003',
    ip: '192.168.1.105',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'log-003',
    action: 'settings.update',
    user: 'admin@mycom.com',
    resource: 'Notification Settings',
    details: 'Updated email notification settings',
    ip: '192.168.1.100',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'log-004',
    action: 'user.create',
    user: 'admin@mycom.com',
    resource: 'User: viewer@mycom.com',
    details: 'Created new user with viewer role',
    ip: '192.168.1.100',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'log-005',
    action: 'api_key.create',
    user: 'admin@mycom.com',
    resource: 'API Key: CI/CD Pipeline',
    details: 'Generated new API key for CI/CD',
    ip: '192.168.1.100',
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Simulated API delay
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100));

// Mock API implementation
const mockApi = {
  async getSettings() {
    await simulateDelay();
    return JSON.parse(JSON.stringify(mockSettings));
  },

  async updateSettings(section, data) {
    await simulateDelay();
    if (!mockSettings[section]) {
      const error = new Error('Settings section not found');
      error.status = 404;
      throw error;
    }
    mockSettings[section] = { ...mockSettings[section], ...data };
    return { ...mockSettings[section] };
  },

  async getUsers() {
    await simulateDelay();
    return [...mockUsers];
  },

  async updateUser(id, data) {
    await simulateDelay();
    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    Object.assign(user, data);
    return { ...user };
  },

  async deleteUser(id) {
    await simulateDelay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    mockUsers.splice(index, 1);
    return { success: true };
  },

  async getApiKeys() {
    await simulateDelay();
    return [...mockApiKeys];
  },

  async createApiKey(data) {
    await simulateDelay();
    const newKey = {
      id: `key-${Date.now()}`,
      name: data.name,
      prefix: `pk_${data.type || 'live'}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      permissions: data.permissions || ['read']
    };
    mockApiKeys.push(newKey);
    return { ...newKey, fullKey: `${newKey.prefix}${Math.random().toString(36).substring(2, 30)}` };
  },

  async revokeApiKey(id) {
    await simulateDelay();
    const index = mockApiKeys.findIndex(k => k.id === id);
    if (index === -1) {
      const error = new Error('API key not found');
      error.status = 404;
      throw error;
    }
    mockApiKeys.splice(index, 1);
    return { success: true };
  },

  async getAuditLogs(filters = {}) {
    await simulateDelay();
    let logs = [...mockAuditLogs];

    if (filters.action) {
      logs = logs.filter(l => l.action.includes(filters.action));
    }
    if (filters.user) {
      logs = logs.filter(l => l.user.includes(filters.user));
    }

    return logs;
  },

  async testNotification(type) {
    await simulateDelay();
    return { success: true, message: `Test ${type} notification sent successfully` };
  }
};

// Real API implementation
const realApi = {
  async getSettings() {
    return apiClient.get('/settings');
  },

  async updateSettings(section, data) {
    return apiClient.patch(`/settings/${section}`, data);
  },

  async getUsers() {
    return apiClient.get('/settings/users');
  },

  async updateUser(id, data) {
    return apiClient.patch(`/settings/users/${id}`, data);
  },

  async deleteUser(id) {
    return apiClient.delete(`/settings/users/${id}`);
  },

  async getApiKeys() {
    return apiClient.get('/settings/api-keys');
  },

  async createApiKey(data) {
    return apiClient.post('/settings/api-keys', data);
  },

  async revokeApiKey(id) {
    return apiClient.delete(`/settings/api-keys/${id}`);
  },

  async getAuditLogs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.action) params.append('action', filters.action);
    if (filters.user) params.append('user', filters.user);
    return apiClient.get(`/settings/audit-logs?${params.toString()}`);
  },

  async testNotification(type) {
    return apiClient.post(`/settings/notifications/test`, { type });
  }
};

// Export the appropriate API based on environment
const useMock = process.env.REACT_APP_USE_MOCK !== 'false';
export const settingsApi = useMock ? mockApi : realApi;
