/**
 * Network Details component with edit and delete actions.
 * All backend operations are non-blocking (fire-and-forget with SSE progress tracking).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNetworkById, updateNetwork, deleteNetwork, DATA_SOURCE } from '../../services/networkService';
import { useTaskContext, TaskStatus } from '../../context/TaskContext';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import NetworkForm from './NetworkForm';
import './NetworkDetails.css';

const statusColors = {
  ACTIVE: '#10b981',
  STANDBY: '#f59e0b',
  MAINTENANCE: '#6366f1',
  INACTIVE: '#6b7280'
};

export function NetworkDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { startTask, tasks } = useTaskContext();

  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit form state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Pending operation state
  const [isPending, setIsPending] = useState(false);
  const [dataSource, setDataSource] = useState(null);

  // Track task IDs for this network's operations
  const networkTaskIds = useRef(new Set());

  const fetchNetwork = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, source } = await getNetworkById(id);
      if (!data) {
        setError('Network not found');
      } else {
        setNetwork(data);
      }
      setDataSource(source);
    } catch (err) {
      setError(err.message || 'Failed to load network details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNetwork();
  }, [fetchNetwork]);

  // Listen for task completion and refresh data
  useEffect(() => {
    networkTaskIds.current.forEach((taskId) => {
      const task = tasks[taskId];
      if (task && (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED)) {
        networkTaskIds.current.delete(taskId);
        setIsPending(false);
        fetchNetwork();
      }
    });
  }, [tasks, fetchNetwork]);

  // Edit Network - Non-blocking
  const handleEditClick = () => {
    setShowEditForm(true);
  };

  const handleEditSubmit = async (formData) => {
    if (!network) return;

    try {
      setEditLoading(true);
      const result = await updateNetwork(network.id, formData);

      if (result.accepted && result.taskId) {
        networkTaskIds.current.add(result.taskId);

        startTask(
          result.taskId,
          'UPDATE_NETWORK',
          `Updating network "${formData.name}"`,
          { networkId: network.id, networkName: formData.name }
        );

        setIsPending(true);

        // Optimistically update the network
        setNetwork(prev => ({ ...prev, ...formData }));
      }

      setShowEditForm(false);
    } catch (err) {
      setError(err.message || 'Failed to update network');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditClose = () => {
    setShowEditForm(false);
  };

  // Delete Network - Non-blocking
  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!network) return;

    setShowDeleteDialog(false);

    try {
      const result = await deleteNetwork(network.id);

      if (result.accepted && result.taskId) {
        startTask(
          result.taskId,
          'DELETE_NETWORK',
          `Deleting network "${network.name}"`,
          { networkId: network.id, networkName: network.name }
        );

        // Navigate back to list immediately
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete network');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="network-details-loading">
        <div className="loading-spinner" />
        <p>Loading network details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="network-details-error">
        <p>{error}</p>
        <div className="error-actions">
          <Button variant="outline" onClick={handleBackClick}>
            Back to List
          </Button>
          <Button onClick={fetchNetwork}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!network) {
    return (
      <div className="network-details-error">
        <p>Network not found</p>
        <Button variant="outline" onClick={handleBackClick}>
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className={`network-details ${isPending ? 'pending' : ''}`}>
      {dataSource === DATA_SOURCE.MOCK && (
        <div className="data-source-banner mock">
          Offline — showing cached data
        </div>
      )}
      {isPending && (
        <div className="pending-banner">
          <div className="pending-spinner-small" />
          <span>Updating network configuration...</span>
        </div>
      )}

      <div className="network-details-header">
        <button className="back-button" onClick={handleBackClick}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12.5 15l-5-5 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Networks
        </button>

        <div className="network-details-title">
          <div className="title-row">
            <h1>{network.name}</h1>
            <span
              className="status-indicator"
              style={{ backgroundColor: statusColors[network.status] }}
            />
            <span className="status-text">{network.status}</span>
          </div>
          <span className="network-type">{network.type}</span>
        </div>

        <div className="network-details-actions">
          <Button variant="outline" onClick={handleEditClick} disabled={isPending}>
            Edit
          </Button>
          <Button variant="danger" onClick={handleDeleteClick} disabled={isPending}>
            Delete Network
          </Button>
        </div>
      </div>

      <div className="network-details-content">
        <div className="details-section">
          <h2>Overview</h2>
          <p className="network-description">{network.description}</p>
        </div>

        <div className="details-grid">
          <div className="details-card">
            <h3>Network Configuration</h3>
            <div className="details-list">
              <div className="detail-row">
                <span className="detail-label">Network ID</span>
                <span className="detail-value mono">{network.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Region</span>
                <span className="detail-value">{network.region}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">IP Range</span>
                <span className="detail-value mono">{network.ipRange}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Network Type</span>
                <span className="detail-value">{network.type}</span>
              </div>
            </div>
          </div>

          <div className="details-card">
            <h3>Performance</h3>
            <div className="details-list">
              <div className="detail-row">
                <span className="detail-label">Bandwidth</span>
                <span className="detail-value">{network.bandwidth}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Latency</span>
                <span className="detail-value">{network.latency}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Active Nodes</span>
                <span className="detail-value">{network.nodes}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`detail-value status-${network.status.toLowerCase()}`}>
                  {network.status}
                </span>
              </div>
            </div>
          </div>

          <div className="details-card full-width">
            <h3>Metadata</h3>
            <div className="details-list horizontal">
              <div className="detail-row">
                <span className="detail-label">Created</span>
                <span className="detail-value">{formatDate(network.createdAt)}</span>
              </div>
              {network.updatedAt && (
                <div className="detail-row">
                  <span className="detail-label">Last Updated</span>
                  <span className="detail-value">{formatDate(network.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      <NetworkForm
        isOpen={showEditForm}
        onClose={handleEditClose}
        onSubmit={handleEditSubmit}
        network={network}
        loading={editLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Network"
        message={`Are you sure you want to delete "${network.name}"? This action cannot be undone and will remove all associated configurations.`}
        confirmText="Delete Network"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default NetworkDetails;
