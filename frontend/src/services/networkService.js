/**
 * Network service with resilient data fetching.
 * Tries the backend API first; falls back to mock data on failure.
 *
 * Components consume { data, source } and never deal with fallback logic.
 */

import mockNetworks from '../data/mockNetworks';

const BACKEND_URL = 'http://localhost:8080/api/networks';
const FETCH_TIMEOUT_MS = 5000;

const DATA_SOURCE = Object.freeze({
  BACKEND: 'BACKEND',
  MOCK: 'MOCK',
});

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
 * Get all networks.
 * @returns {Promise<{ data: Array, source: string }>}
 */
export async function getNetworks() {
  try {
    const response = await fetchWithTimeout(BACKEND_URL);

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Backend response is not an array');
    }

    return { data, source: DATA_SOURCE.BACKEND };
  } catch (err) {
    console.warn('[networkService] Backend unavailable, using mock data:', err.message);
    return { data: [...mockNetworks], source: DATA_SOURCE.MOCK };
  }
}

/**
 * Get a single network by ID.
 * @param {string} id
 * @returns {Promise<{ data: object|null, source: string }>}
 */
export async function getNetworkById(id) {
  try {
    const response = await fetchWithTimeout(`${BACKEND_URL}/${id}`);

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return { data, source: DATA_SOURCE.BACKEND };
  } catch (err) {
    console.warn(`[networkService] Backend unavailable for network ${id}, using mock data:`, err.message);
    const network = mockNetworks.find((n) => n.id === id) || null;
    return { data: network, source: DATA_SOURCE.MOCK };
  }
}

/**
 * Create a new network (fire-and-forget).
 * @param {object} networkData
 * @returns {Promise<{accepted, taskId, message, data}>} 202 response with task info
 */
export async function createNetwork(networkData) {
  const response = await fetchWithTimeout(BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(networkData),
  });

  if (!response.ok && response.status !== 202) {
    const text = await response.text();
    throw new Error(text || `Failed to create network (HTTP ${response.status})`);
  }

  return await response.json();
}

/**
 * Update an existing network (fire-and-forget).
 * @param {string} id
 * @param {object} networkData
 * @returns {Promise<{accepted, taskId, message, data}>} 202 response with task info
 */
export async function updateNetwork(id, networkData) {
  const response = await fetchWithTimeout(`${BACKEND_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(networkData),
  });

  if (!response.ok && response.status !== 202) {
    const text = await response.text();
    throw new Error(text || `Failed to update network (HTTP ${response.status})`);
  }

  return await response.json();
}

/**
 * Delete a network (fire-and-forget).
 * @param {string} id
 * @returns {Promise<{accepted, taskId, message, data}>} 202 response with task info
 */
export async function deleteNetwork(id) {
  const response = await fetchWithTimeout(`${BACKEND_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 202) {
    const text = await response.text();
    throw new Error(text || `Failed to delete network (HTTP ${response.status})`);
  }

  return await response.json();
}

export { DATA_SOURCE };
