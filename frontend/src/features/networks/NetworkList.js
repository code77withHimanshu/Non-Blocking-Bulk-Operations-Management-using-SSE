/**
 * Network List component with create, edit, and delete actions.
 * All backend operations are non-blocking (fire-and-forget with SSE progress tracking).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNetworks, createNetwork, updateNetwork, deleteNetwork, DATA_SOURCE } from '../../services/networkService';
import { useTaskContext, TaskStatus } from '../../context/TaskContext';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import NetworkForm from './NetworkForm';
import './NetworkList.css';

const statusColors = {
  ACTIVE: '#10b981',
  STANDBY: '#f59e0b',
  MAINTENANCE: '#6366f1',
  INACTIVE: '#6b7280'
};

export function NetworkList() {
  const navigate = useNavigate();
  const { startTask, tasks } = useTaskContext();

  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(null);

  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Track networks with pending operations (shown with opacity)
  const [pendingNetworks, setPendingNetworks] = useState(new Set());

  // Track task IDs for network operations to detect completion
  const networkTaskIds = useRef(new Set());

  const fetchNetworks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, source } = await getNetworks();
      setNetworks(data);
      setDataSource(source);
    } catch (err) {
      setError(err.message || 'Failed to load networks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNetworks();
  }, [fetchNetworks]);

  // Listen for task completion and update state directly
  useEffect(() => {
    networkTaskIds.current.forEach((taskId) => {
      const task = tasks[taskId];
      if (!task) return;

      if (task.status === TaskStatus.COMPLETED) {
        networkTaskIds.current.delete(taskId);
        const networkId = task.metadata?.networkId;

        // Clear pending status
        if (networkId) {
          setPendingNetworks(prev => {
            const next = new Set(prev);
            next.delete(networkId);
            return next;
          });
        }

        if (task.type === 'DELETE_NETWORK' && networkId) {
          // Remove the deleted network from local state
          setNetworks(prev => prev.filter(n => n.id !== networkId));
        } else {
          // CREATE or UPDATE — clear _pending flag, keep optimistic data
          setNetworks(prev =>
            prev.map(n =>
              n.id === networkId ? { ...n, _pending: false } : n
            )
          );
        }
      } else if (task.status === TaskStatus.FAILED) {
        networkTaskIds.current.delete(taskId);
        const networkId = task.metadata?.networkId;

        // Clear pending status
        if (networkId) {
          setPendingNetworks(prev => {
            const next = new Set(prev);
            next.delete(networkId);
            return next;
          });
        }

        if (task.type === 'CREATE_NETWORK' && networkId) {
          // Revert: remove the optimistic network that was never actually created
          setNetworks(prev => prev.filter(n => n.id !== networkId));
        } else {
          // UPDATE or DELETE failed — refetch to get the true state
          fetchNetworks();
        }
      }
    });
  }, [tasks, fetchNetworks]);

  // Create Network - Non-blocking
  const handleCreateClick = () => {
    setEditingNetwork(null);
    setShowForm(true);
  };

  const handleCreateSubmit = async (formData) => {
    try {
      setFormLoading(true);
      const result = await createNetwork(formData);

      if (result.accepted && result.taskId) {
        // Track this task for completion detection
        networkTaskIds.current.add(result.taskId);

        // Start tracking the task
        startTask(
          result.taskId,
          'CREATE_NETWORK',
          `Creating network "${formData.name}"`,
          { networkName: formData.name, networkId: result.data.networkId }
        );

        // Optimistically add a placeholder to the list
        const optimisticNetwork = {
          id: result.data.networkId,
          ...formData,
          _pending: true
        };
        setNetworks(prev => [optimisticNetwork, ...prev]);
        setPendingNetworks(prev => new Set([...prev, result.data.networkId]));
      }

      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Failed to create network');
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Network - Non-blocking
  const handleEditClick = (network, e) => {
    e.stopPropagation();
    setEditingNetwork(network);
    setShowForm(true);
  };

  const handleEditSubmit = async (formData) => {
    if (!editingNetwork) return;

    try {
      setFormLoading(true);
      const result = await updateNetwork(editingNetwork.id, formData);

      if (result.accepted && result.taskId) {
        // Track this task for completion detection
        networkTaskIds.current.add(result.taskId);

        // Start tracking the task
        startTask(
          result.taskId,
          'UPDATE_NETWORK',
          `Updating network "${formData.name}"`,
          { networkId: editingNetwork.id, networkName: formData.name }
        );

        // Mark network as pending
        setPendingNetworks(prev => new Set([...prev, editingNetwork.id]));

        // Optimistically update the network in the list
        setNetworks(prev =>
          prev.map(n =>
            n.id === editingNetwork.id
              ? { ...n, ...formData, _pending: true }
              : n
          )
        );
      }

      setShowForm(false);
      setEditingNetwork(null);
    } catch (err) {
      setError(err.message || 'Failed to update network');
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingNetwork(null);
  };

  // Delete Network - Non-blocking
  const handleDeleteClick = (network, e) => {
    e.stopPropagation();
    setDeleteTarget(network);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    const networkToDelete = deleteTarget;
    setDeleteTarget(null); // Close dialog immediately - non-blocking

    try {
      const result = await deleteNetwork(networkToDelete.id);

      if (result.accepted && result.taskId) {
        // Track this task for completion detection
        networkTaskIds.current.add(result.taskId);

        // Start tracking the task
        startTask(
          result.taskId,
          'DELETE_NETWORK',
          `Deleting network "${networkToDelete.name}"`,
          { networkId: networkToDelete.id, networkName: networkToDelete.name }
        );

        // Mark network as pending deletion (visual feedback)
        setPendingNetworks(prev => new Set([...prev, networkToDelete.id]));
      }
    } catch (err) {
      setError(err.message || 'Failed to delete network');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  const handleNetworkClick = (network) => {
    // Don't navigate if network has pending operation
    if (pendingNetworks.has(network.id)) return;
    navigate(`/networks/${network.id}`);
  };

  if (loading) {
    return (
      <div className="network-list-loading">
        <div className="loading-spinner" />
        <p>Loading networks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="network-list-error">
        <p>{error}</p>
        <Button onClick={fetchNetworks}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="network-list">
      <div className="network-list-header">
        <div className="header-content">
          <h1>Network Management</h1>
          <p className="network-list-subtitle">
            Manage your telecom network infrastructure
          </p>
          {dataSource === DATA_SOURCE.MOCK && (
            <span className="data-source-badge mock">
              Offline — showing cached data
            </span>
          )}
        </div>
        <div className="header-actions">
          <Button variant="outline" onClick={fetchNetworks}>
            Refresh
          </Button>
          <Button variant="primary" onClick={handleCreateClick}>
            + Add Network
          </Button>
        </div>
      </div>

      {networks.length === 0 ? (
        <div className="network-list-empty">
          <div className="empty-icon">📡</div>
          <h3>No networks found</h3>
          <p>Get started by creating your first network</p>
          <Button variant="primary" onClick={handleCreateClick}>
            Create Network
          </Button>
        </div>
      ) : (
        <div className="network-grid">
          {networks.map((network) => (
            <div
              key={network.id}
              className={`network-card ${pendingNetworks.has(network.id) ? 'pending' : ''}`}
              onClick={() => handleNetworkClick(network)}
            >
              {pendingNetworks.has(network.id) && (
                <div className="pending-overlay">
                  <div className="pending-spinner" />
                  <span>Processing...</span>
                </div>
              )}

              <div className="network-card-header">
                <div className="network-card-title">
                  <h3>{network.name}</h3>
                  <span
                    className="network-status-dot"
                    style={{ backgroundColor: statusColors[network.status] }}
                  />
                </div>
                <span className="network-type-badge">{network.type}</span>
              </div>

              <p className="network-card-description">{network.description}</p>

              <div className="network-card-details">
                <div className="network-detail">
                  <span className="detail-label">Region</span>
                  <span className="detail-value">{network.region}</span>
                </div>
                <div className="network-detail">
                  <span className="detail-label">IP Range</span>
                  <span className="detail-value">{network.ipRange}</span>
                </div>
                <div className="network-detail">
                  <span className="detail-label">Bandwidth</span>
                  <span className="detail-value">{network.bandwidth}</span>
                </div>
                <div className="network-detail">
                  <span className="detail-label">Nodes</span>
                  <span className="detail-value">{network.nodes}</span>
                </div>
              </div>

              <div className="network-card-footer">
                <span className="network-status">{network.status}</span>
                <div className="card-actions">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={(e) => handleEditClick(network, e)}
                    disabled={pendingNetworks.has(network.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={(e) => handleDeleteClick(network, e)}
                    disabled={pendingNetworks.has(network.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      <NetworkForm
        isOpen={showForm}
        onClose={handleFormClose}
        onSubmit={editingNetwork ? handleEditSubmit : handleCreateSubmit}
        network={editingNetwork}
        loading={formLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Network"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone and will remove all associated configurations.`}
        confirmText="Delete Network"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default NetworkList;
