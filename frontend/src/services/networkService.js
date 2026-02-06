/**
 * Network service with resilient data fetching.
 * Tries the backend API first; falls back to a mutable in-memory mock store on failure.
 *
 * Components consume { data, source } and never deal with fallback logic.
 */

import initialMockNetworks from '../data/mockNetworks';

const BACKEND_URL = 'http://localhost:8080/api/networks';
const FETCH_TIMEOUT_MS = 5000;

const DATA_SOURCE = Object.freeze({
  BACKEND: 'BACKEND',
  MOCK: 'MOCK',
});

/**
 * Mutable in-memory store for mock data.
 * CRUD operations update this store so subsequent reads reflect changes.
 */
let mockStore = [...initialMockNetworks];

/**
 * Fetch with an AbortController-based timeout.
 */
function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

/**
 * Generate a simple unique ID for mock operations.
 */
function generateId() {
  return `net-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Generate a mock task ID.
 */
function generateTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Headers that prevent browser caching of GET responses.
 */
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
};

/**
 * Get all networks.
 * @returns {Promise<{ data: Array, source: string }>}
 */
export async function getNetworks() {
  try {
    const response = await fetchWithTimeout(BACKEND_URL, {
      headers: NO_CACHE_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Backend response is not an array');
    }

    // Sync mock store with backend data so switching between modes stays consistent
    mockStore = [...data];

    return { data, source: DATA_SOURCE.BACKEND };
  } catch (err) {
    console.warn('[networkService] Backend unavailable, using mock data:', err.message);
    return { data: [...mockStore], source: DATA_SOURCE.MOCK };
  }
}

/**
 * Get a single network by ID.
 * @param {string} id
 * @returns {Promise<{ data: object|null, source: string }>}
 */
export async function getNetworkById(id) {
  try {
    const response = await fetchWithTimeout(`${BACKEND_URL}/${id}`, {
      headers: NO_CACHE_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return { data, source: DATA_SOURCE.BACKEND };
  } catch (err) {
    console.warn(`[networkService] Backend unavailable for network ${id}, using mock data:`, err.message);
    const network = mockStore.find((n) => n.id === id) || null;
    return { data: network, source: DATA_SOURCE.MOCK };
  }
}

/**
 * Create a new network (fire-and-forget).
 * Falls back to mock store when backend is unreachable.
 * @param {object} networkData
 * @returns {Promise<{accepted, taskId, message, data}>} 202-style response with task info
 */
export async function createNetwork(networkData) {
  try {
    const response = await fetchWithTimeout(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(networkData),
    });

    if (!response.ok && response.status !== 202) {
      const text = await response.text();
      throw new Error(text || `Failed to create network (HTTP ${response.status})`);
    }

    const result = await response.json();

    // Also update mock store so reads stay consistent
    const networkId = result.data?.networkId || result.networkId || generateId();
    const newNetwork = {
      id: networkId,
      ...networkData,
      createdAt: new Date().toISOString(),
    };
    mockStore = [newNetwork, ...mockStore];

    return result;
  } catch (err) {
    console.warn('[networkService] Backend unavailable for create, using mock fallback:', err.message);

    const networkId = generateId();
    const newNetwork = {
      id: networkId,
      ...networkData,
      createdAt: new Date().toISOString(),
    };
    mockStore = [newNetwork, ...mockStore];

    return {
      accepted: true,
      taskId: generateTaskId(),
      message: 'Network creation started (mock)',
      data: { networkId, networkName: networkData.name, network: newNetwork },
    };
  }
}

/**
 * Update an existing network (fire-and-forget).
 * Falls back to mock store when backend is unreachable.
 * @param {string} id
 * @param {object} networkData
 * @returns {Promise<{accepted, taskId, message, data}>} 202-style response with task info
 */
export async function updateNetwork(id, networkData) {
  try {
    const response = await fetchWithTimeout(`${BACKEND_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(networkData),
    });

    if (!response.ok && response.status !== 202) {
      const text = await response.text();
      throw new Error(text || `Failed to update network (HTTP ${response.status})`);
    }

    const result = await response.json();

    // Also update mock store
    mockStore = mockStore.map((n) =>
      n.id === id ? { ...n, ...networkData, updatedAt: new Date().toISOString() } : n
    );

    return result;
  } catch (err) {
    console.warn('[networkService] Backend unavailable for update, using mock fallback:', err.message);

    mockStore = mockStore.map((n) =>
      n.id === id ? { ...n, ...networkData, updatedAt: new Date().toISOString() } : n
    );

    return {
      accepted: true,
      taskId: generateTaskId(),
      message: 'Network update started (mock)',
      data: { networkId: id, networkName: networkData.name },
    };
  }
}

/**
 * Delete a network (fire-and-forget).
 * Falls back to mock store when backend is unreachable.
 * @param {string} id
 * @returns {Promise<{accepted, taskId, message, data}>} 202-style response with task info
 */
export async function deleteNetwork(id) {
  try {
    const response = await fetchWithTimeout(`${BACKEND_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 202) {
      const text = await response.text();
      throw new Error(text || `Failed to delete network (HTTP ${response.status})`);
    }

    const result = await response.json();

    // Also update mock store
    mockStore = mockStore.filter((n) => n.id !== id);

    return result;
  } catch (err) {
    console.warn('[networkService] Backend unavailable for delete, using mock fallback:', err.message);

    const network = mockStore.find((n) => n.id === id);
    mockStore = mockStore.filter((n) => n.id !== id);

    return {
      accepted: true,
      taskId: generateTaskId(),
      message: 'Network deletion started (mock)',
      data: { networkId: id, networkName: network?.name },
    };
  }
}

export { DATA_SOURCE };
