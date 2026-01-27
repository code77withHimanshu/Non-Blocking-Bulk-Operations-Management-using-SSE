/**
 * Network API endpoints with mock data support
 */

import apiClient from './client';
import mockNetworksData from '../data/mockNetworks';

// Check if we're in mock mode (defaults to real backend)
const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'true';

// Mutable copy for add/edit/delete operations during mock mode
let mockNetworks = [...mockNetworksData];

// Helper to simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate unique task ID
const generateTaskId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Mock API implementations
 */
const mockApi = {
  async getAll() {
    await delay(300);
    return [...mockNetworks];
  },

  async getById(id) {
    await delay(200);
    const network = mockNetworks.find(n => n.id === id);
    if (!network) {
      const error = new Error('Network not found');
      error.status = 404;
      throw error;
    }
    return { ...network };
  },

  async deleteNetwork(id) {
    await delay(150);
    const network = mockNetworks.find(n => n.id === id);
    if (!network) {
      const error = new Error('Network not found');
      error.status = 404;
      throw error;
    }

    const networkName = network.name;

    // Remove from mock data immediately - the SSE will control when the UI sees it
    // (UI won't refresh until SSE completes, which takes 1-3 minutes)
    mockNetworks = mockNetworks.filter(n => n.id !== id);
    console.log(`[Mock API] Delete operation started for "${networkName}" - data removed, waiting for SSE completion to refresh UI`);

    // Return 202 Accepted with taskId for fire-and-forget operation
    return {
      accepted: true,
      taskId: generateTaskId(),
      message: `Delete operation started for network "${networkName}"`,
      data: {
        networkId: id,
        networkName: networkName
      }
    };
  },

  async createNetwork(networkData) {
    await delay(200);

    const newNetwork = {
      id: `net-${Date.now().toString(36)}`,
      ...networkData,
      createdAt: new Date().toISOString()
    };

    // Return 202 Accepted with taskId for fire-and-forget operation
    const taskId = generateTaskId();

    // Add network to mock data immediately - the SSE will control when the UI sees the final state
    // (UI shows optimistic update immediately, then refreshes when SSE completes in 1-3 minutes)
    mockNetworks.unshift(newNetwork);
    console.log(`[Mock API] Create operation started for "${networkData.name}" - data added, waiting for SSE completion to refresh UI`);

    return {
      accepted: true,
      taskId,
      message: `Create operation started for network "${networkData.name}"`,
      data: {
        networkId: newNetwork.id,
        networkName: networkData.name,
        network: newNetwork
      }
    };
  },

  async updateNetwork(id, networkData) {
    await delay(200);
    const networkIndex = mockNetworks.findIndex(n => n.id === id);
    if (networkIndex === -1) {
      const error = new Error('Network not found');
      error.status = 404;
      throw error;
    }

    const taskId = generateTaskId();

    // Update network in mock data immediately - the SSE will control when the UI sees the final state
    // (UI shows optimistic update immediately, then refreshes when SSE completes in 1-3 minutes)
    mockNetworks[networkIndex] = {
      ...mockNetworks[networkIndex],
      ...networkData,
      updatedAt: new Date().toISOString()
    };
    console.log(`[Mock API] Update operation started for "${networkData.name}" - data updated, waiting for SSE completion to refresh UI`);

    return {
      accepted: true,
      taskId,
      message: `Update operation started for network "${networkData.name}"`,
      data: {
        networkId: id,
        networkName: networkData.name
      }
    };
  }
};

/**
 * Real API implementations
 */
const realApi = {
  getAll() {
    return apiClient.get('/networks');
  },

  getById(id) {
    return apiClient.get(`/networks/${id}`);
  },

  deleteNetwork(id) {
    return apiClient.delete(`/networks/${id}`);
  },

  createNetwork(networkData) {
    return apiClient.post('/networks', networkData);
  },

  updateNetwork(id, networkData) {
    return apiClient.put(`/networks/${id}`, networkData);
  }
};

// Export the appropriate API based on mock mode
const networksApi = USE_MOCK ? mockApi : realApi;

export default networksApi;
export { mockNetworks };
