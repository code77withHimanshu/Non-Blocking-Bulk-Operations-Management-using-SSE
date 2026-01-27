/**
 * Monitoring API client
 * Handles all monitoring-related HTTP requests
 */

import { apiClient } from './client';

// Mock data for development
const mockMetrics = [
  {
    id: 'metric-1',
    networkId: 'net-001',
    networkName: 'Production Network Alpha',
    type: 'bandwidth',
    value: 8.5,
    unit: 'Gbps',
    threshold: 10,
    status: 'NORMAL',
    trend: 'up',
    trendPercent: 5.2,
    lastUpdated: new Date(Date.now() - 30000).toISOString()
  },
  {
    id: 'metric-2',
    networkId: 'net-001',
    networkName: 'Production Network Alpha',
    type: 'latency',
    value: 2.3,
    unit: 'ms',
    threshold: 5,
    status: 'NORMAL',
    trend: 'down',
    trendPercent: 1.8,
    lastUpdated: new Date(Date.now() - 45000).toISOString()
  },
  {
    id: 'metric-3',
    networkId: 'net-002',
    networkName: 'Enterprise WAN Beta',
    type: 'bandwidth',
    value: 4.2,
    unit: 'Gbps',
    threshold: 5,
    status: 'WARNING',
    trend: 'up',
    trendPercent: 12.5,
    lastUpdated: new Date(Date.now() - 60000).toISOString()
  },
  {
    id: 'metric-4',
    networkId: 'net-002',
    networkName: 'Enterprise WAN Beta',
    type: 'latency',
    value: 8.1,
    unit: 'ms',
    threshold: 10,
    status: 'WARNING',
    trend: 'up',
    trendPercent: 8.3,
    lastUpdated: new Date(Date.now() - 30000).toISOString()
  },
  {
    id: 'metric-5',
    networkId: 'net-003',
    networkName: 'IoT Mesh Network',
    type: 'packet_loss',
    value: 0.02,
    unit: '%',
    threshold: 1,
    status: 'NORMAL',
    trend: 'stable',
    trendPercent: 0,
    lastUpdated: new Date(Date.now() - 120000).toISOString()
  },
  {
    id: 'metric-6',
    networkId: 'net-004',
    networkName: 'Data Center Backbone',
    type: 'throughput',
    value: 45.8,
    unit: 'Gbps',
    threshold: 50,
    status: 'WARNING',
    trend: 'up',
    trendPercent: 3.2,
    lastUpdated: new Date(Date.now() - 15000).toISOString()
  },
  {
    id: 'metric-7',
    networkId: 'net-005',
    networkName: 'Edge Computing Network',
    type: 'cpu_usage',
    value: 78,
    unit: '%',
    threshold: 80,
    status: 'WARNING',
    trend: 'up',
    trendPercent: 5.0,
    lastUpdated: new Date(Date.now() - 20000).toISOString()
  },
  {
    id: 'metric-8',
    networkId: 'net-005',
    networkName: 'Edge Computing Network',
    type: 'memory_usage',
    value: 62,
    unit: '%',
    threshold: 85,
    status: 'NORMAL',
    trend: 'stable',
    trendPercent: 0.5,
    lastUpdated: new Date(Date.now() - 20000).toISOString()
  }
];

const mockHealthSummary = {
  totalNetworks: 5,
  healthyNetworks: 3,
  warningNetworks: 2,
  criticalNetworks: 0,
  overallHealth: 85,
  avgLatency: 4.2,
  avgBandwidthUtilization: 68,
  totalNodes: 1247,
  activeNodes: 1235,
  lastUpdated: new Date().toISOString()
};

const mockNetworkHealth = [
  {
    id: 'net-001',
    name: 'Production Network Alpha',
    type: '5G',
    health: 95,
    status: 'HEALTHY',
    activeNodes: 342,
    totalNodes: 350,
    uptime: 99.99,
    lastIncident: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'net-002',
    name: 'Enterprise WAN Beta',
    type: '4G LTE',
    health: 72,
    status: 'WARNING',
    activeNodes: 198,
    totalNodes: 200,
    uptime: 99.85,
    lastIncident: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'net-003',
    name: 'IoT Mesh Network',
    type: 'NB-IoT',
    health: 98,
    status: 'HEALTHY',
    activeNodes: 520,
    totalNodes: 520,
    uptime: 99.97,
    lastIncident: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'net-004',
    name: 'Data Center Backbone',
    type: 'Fiber',
    health: 88,
    status: 'HEALTHY',
    activeNodes: 45,
    totalNodes: 47,
    uptime: 99.95,
    lastIncident: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'net-005',
    name: 'Edge Computing Network',
    type: '5G',
    health: 75,
    status: 'WARNING',
    activeNodes: 130,
    totalNodes: 130,
    uptime: 99.80,
    lastIncident: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];

// Simulated API delay for realistic experience
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100));

// Mock API implementation
const mockApi = {
  async getMetrics() {
    await simulateDelay();
    return [...mockMetrics];
  },

  async getHealthSummary() {
    await simulateDelay();
    return { ...mockHealthSummary, lastUpdated: new Date().toISOString() };
  },

  async getNetworkHealth() {
    await simulateDelay();
    return [...mockNetworkHealth];
  },

  async getNetworkMetrics(networkId) {
    await simulateDelay();
    const metrics = mockMetrics.filter(m => m.networkId === networkId);
    if (metrics.length === 0) {
      const error = new Error('Network not found');
      error.status = 404;
      throw error;
    }
    return metrics;
  }
};

// Real API implementation
const realApi = {
  async getMetrics() {
    return apiClient.get('/monitoring/metrics');
  },

  async getHealthSummary() {
    return apiClient.get('/monitoring/health/summary');
  },

  async getNetworkHealth() {
    return apiClient.get('/monitoring/health/networks');
  },

  async getNetworkMetrics(networkId) {
    return apiClient.get(`/monitoring/networks/${networkId}/metrics`);
  }
};

// Export the appropriate API based on environment
const useMock = process.env.REACT_APP_USE_MOCK !== 'false';
export const monitoringApi = useMock ? mockApi : realApi;
