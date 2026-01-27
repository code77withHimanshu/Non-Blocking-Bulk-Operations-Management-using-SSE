/**
 * Alerts API client
 * Handles all alerts-related HTTP requests
 */

import { apiClient } from './client';

// Mock data for development
const mockAlerts = [
  {
    id: 'alert-001',
    networkId: 'net-002',
    networkName: 'Enterprise WAN Beta',
    title: 'High Latency Detected',
    message: 'Network latency has exceeded the configured threshold of 10ms. Current latency is 12.5ms.',
    severity: 'WARNING',
    category: 'performance',
    status: 'ACTIVE',
    triggeredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    acknowledgedAt: null,
    resolvedAt: null,
    acknowledgedBy: null
  },
  {
    id: 'alert-002',
    networkId: 'net-005',
    networkName: 'Edge Computing Network',
    title: 'CPU Usage Critical',
    message: 'CPU utilization has reached 92% on edge node cluster. Immediate attention required.',
    severity: 'CRITICAL',
    category: 'resource',
    status: 'ACTIVE',
    triggeredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    acknowledgedAt: null,
    resolvedAt: null,
    acknowledgedBy: null
  },
  {
    id: 'alert-003',
    networkId: 'net-004',
    networkName: 'Data Center Backbone',
    title: 'Node Offline',
    message: 'Node DC-CORE-02 is not responding to health checks. Last seen 10 minutes ago.',
    severity: 'CRITICAL',
    category: 'connectivity',
    status: 'ACKNOWLEDGED',
    triggeredAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    resolvedAt: null,
    acknowledgedBy: 'admin@mycom.com'
  },
  {
    id: 'alert-004',
    networkId: 'net-001',
    networkName: 'Production Network Alpha',
    title: 'Bandwidth Threshold Warning',
    message: 'Bandwidth utilization approaching 85% threshold. Consider capacity expansion.',
    severity: 'WARNING',
    category: 'capacity',
    status: 'ACTIVE',
    triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    acknowledgedAt: null,
    resolvedAt: null,
    acknowledgedBy: null
  },
  {
    id: 'alert-005',
    networkId: 'net-003',
    networkName: 'IoT Mesh Network',
    title: 'Certificate Expiring Soon',
    message: 'SSL certificate for IoT gateway will expire in 7 days. Please renew to avoid service disruption.',
    severity: 'INFO',
    category: 'security',
    status: 'ACTIVE',
    triggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    acknowledgedAt: null,
    resolvedAt: null,
    acknowledgedBy: null
  },
  {
    id: 'alert-006',
    networkId: 'net-002',
    networkName: 'Enterprise WAN Beta',
    title: 'Packet Loss Detected',
    message: 'Packet loss rate has increased to 2.5% on WAN link. Investigating root cause.',
    severity: 'WARNING',
    category: 'performance',
    status: 'RESOLVED',
    triggeredAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    acknowledgedBy: 'netops@mycom.com'
  },
  {
    id: 'alert-007',
    networkId: 'net-001',
    networkName: 'Production Network Alpha',
    title: 'Maintenance Window Starting',
    message: 'Scheduled maintenance will begin in 30 minutes. Expected duration: 2 hours.',
    severity: 'INFO',
    category: 'maintenance',
    status: 'RESOLVED',
    triggeredAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    acknowledgedBy: 'system'
  },
  {
    id: 'alert-008',
    networkId: 'net-005',
    networkName: 'Edge Computing Network',
    title: 'Memory Usage High',
    message: 'Memory utilization on edge nodes has exceeded 80%. Consider scaling resources.',
    severity: 'WARNING',
    category: 'resource',
    status: 'ACTIVE',
    triggeredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    acknowledgedAt: null,
    resolvedAt: null,
    acknowledgedBy: null
  }
];

const mockAlertRules = [
  {
    id: 'rule-001',
    name: 'High Latency Alert',
    description: 'Triggers when network latency exceeds threshold',
    metric: 'latency',
    condition: 'greater_than',
    threshold: 10,
    unit: 'ms',
    severity: 'WARNING',
    enabled: true,
    networks: ['all'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rule-002',
    name: 'Critical CPU Usage',
    description: 'Triggers when CPU usage exceeds 90%',
    metric: 'cpu_usage',
    condition: 'greater_than',
    threshold: 90,
    unit: '%',
    severity: 'CRITICAL',
    enabled: true,
    networks: ['all'],
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rule-003',
    name: 'Bandwidth Capacity Warning',
    description: 'Alerts when bandwidth utilization reaches 85%',
    metric: 'bandwidth_utilization',
    condition: 'greater_than',
    threshold: 85,
    unit: '%',
    severity: 'WARNING',
    enabled: true,
    networks: ['net-001', 'net-004'],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rule-004',
    name: 'Node Connectivity',
    description: 'Triggers when a node becomes unreachable',
    metric: 'node_status',
    condition: 'equals',
    threshold: 'offline',
    unit: '',
    severity: 'CRITICAL',
    enabled: true,
    networks: ['all'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rule-005',
    name: 'Packet Loss Detection',
    description: 'Alerts when packet loss exceeds acceptable levels',
    metric: 'packet_loss',
    condition: 'greater_than',
    threshold: 1,
    unit: '%',
    severity: 'WARNING',
    enabled: false,
    networks: ['all'],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockAlertStats = {
  total: 8,
  active: 5,
  acknowledged: 1,
  resolved: 2,
  bySeverity: {
    critical: 2,
    warning: 4,
    info: 2
  },
  byCategory: {
    performance: 2,
    resource: 2,
    connectivity: 1,
    capacity: 1,
    security: 1,
    maintenance: 1
  }
};

// Simulated API delay
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100));

// Mock API implementation
const mockApi = {
  async getAlerts(filters = {}) {
    await simulateDelay();
    let alerts = [...mockAlerts];

    if (filters.status && filters.status !== 'all') {
      alerts = alerts.filter(a => a.status === filters.status);
    }
    if (filters.severity && filters.severity !== 'all') {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }
    if (filters.networkId) {
      alerts = alerts.filter(a => a.networkId === filters.networkId);
    }

    return alerts;
  },

  async getAlertById(id) {
    await simulateDelay();
    const alert = mockAlerts.find(a => a.id === id);
    if (!alert) {
      const error = new Error('Alert not found');
      error.status = 404;
      throw error;
    }
    return { ...alert };
  },

  async acknowledgeAlert(id) {
    await simulateDelay();
    const alert = mockAlerts.find(a => a.id === id);
    if (!alert) {
      const error = new Error('Alert not found');
      error.status = 404;
      throw error;
    }
    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = 'current-user@mycom.com';
    return { ...alert };
  },

  async resolveAlert(id) {
    await simulateDelay();
    const alert = mockAlerts.find(a => a.id === id);
    if (!alert) {
      const error = new Error('Alert not found');
      error.status = 404;
      throw error;
    }
    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date().toISOString();
    return { ...alert };
  },

  async getAlertStats() {
    await simulateDelay();
    return { ...mockAlertStats };
  },

  async getAlertRules() {
    await simulateDelay();
    return [...mockAlertRules];
  },

  async toggleAlertRule(id, enabled) {
    await simulateDelay();
    const rule = mockAlertRules.find(r => r.id === id);
    if (!rule) {
      const error = new Error('Alert rule not found');
      error.status = 404;
      throw error;
    }
    rule.enabled = enabled;
    return { ...rule };
  }
};

// Real API implementation
const realApi = {
  async getAlerts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.networkId) params.append('networkId', filters.networkId);
    return apiClient.get(`/alerts?${params.toString()}`);
  },

  async getAlertById(id) {
    return apiClient.get(`/alerts/${id}`);
  },

  async acknowledgeAlert(id) {
    return apiClient.post(`/alerts/${id}/acknowledge`);
  },

  async resolveAlert(id) {
    return apiClient.post(`/alerts/${id}/resolve`);
  },

  async getAlertStats() {
    return apiClient.get('/alerts/stats');
  },

  async getAlertRules() {
    return apiClient.get('/alerts/rules');
  },

  async toggleAlertRule(id, enabled) {
    return apiClient.patch(`/alerts/rules/${id}`, { enabled });
  }
};

// Export the appropriate API based on environment
const useMock = process.env.REACT_APP_USE_MOCK !== 'false';
export const alertsApi = useMock ? mockApi : realApi;
