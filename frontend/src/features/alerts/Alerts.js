import React, { useState, useEffect, useCallback } from 'react';
import { alertsApi } from '../../api/alerts';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import './Alerts.css';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [alertStats, setAlertStats] = useState(null);
  const [alertRules, setAlertRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('alerts');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all'
  });
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [alertsData, statsData, rulesData] = await Promise.all([
        alertsApi.getAlerts(filters),
        alertsApi.getAlertStats(),
        alertsApi.getAlertRules()
      ]);
      setAlerts(alertsData);
      setAlertStats(statsData);
      setAlertRules(rulesData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAcknowledge = async (alertId) => {
    setActionLoading(alertId);
    try {
      await alertsApi.acknowledgeAlert(alertId);
      await fetchData();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (alertId) => {
    setActionLoading(alertId);
    try {
      await alertsApi.resolveAlert(alertId);
      await fetchData();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRule = async (ruleId, currentEnabled) => {
    setActionLoading(ruleId);
    try {
      await alertsApi.toggleAlertRule(ruleId, !currentEnabled);
      await fetchData();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return '🔴';
      case 'WARNING':
        return '🟠';
      case 'INFO':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'performance':
        return '⚡';
      case 'resource':
        return '💻';
      case 'connectivity':
        return '🔌';
      case 'capacity':
        return '📊';
      case 'security':
        return '🔒';
      case 'maintenance':
        return '🔧';
      default:
        return '📋';
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'N/A';
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getConditionText = (condition) => {
    switch (condition) {
      case 'greater_than':
        return '>';
      case 'less_than':
        return '<';
      case 'equals':
        return '=';
      case 'not_equals':
        return '≠';
      default:
        return condition;
    }
  };

  if (loading) {
    return (
      <div className="alerts-loading">
        <div className="spinner"></div>
        <p>Loading alerts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alerts-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Alerts</h3>
        <p>{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="alerts">
      <div className="alerts-header">
        <div className="header-left">
          <h1>Alerts</h1>
          <p className="header-subtitle">Monitor and manage network alerts</p>
        </div>
        <div className="header-right">
          <Button variant="outline" onClick={fetchData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="alert-stats">
        <div className="stat-card">
          <div className="stat-icon total">📊</div>
          <div className="stat-content">
            <span className="stat-value">{alertStats?.total || 0}</span>
            <span className="stat-label">Total Alerts</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">🔔</div>
          <div className="stat-content">
            <span className="stat-value">{alertStats?.active || 0}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon critical">🔴</div>
          <div className="stat-content">
            <span className="stat-value">{alertStats?.bySeverity?.critical || 0}</span>
            <span className="stat-label">Critical</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">🟠</div>
          <div className="stat-content">
            <span className="stat-value">{alertStats?.bySeverity?.warning || 0}</span>
            <span className="stat-label">Warnings</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon resolved">✓</div>
          <div className="stat-content">
            <span className="stat-value">{alertStats?.resolved || 0}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="alerts-tabs">
        <button
          className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Alert List
        </button>
        <button
          className={`tab ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          Alert Rules
        </button>
      </div>

      {activeTab === 'alerts' && (
        <>
          {/* Filters */}
          <div className="alerts-filters">
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              >
                <option value="all">All Severity</option>
                <option value="CRITICAL">Critical</option>
                <option value="WARNING">Warning</option>
                <option value="INFO">Info</option>
              </select>
            </div>
          </div>

          {/* Alert List */}
          <div className="alerts-list">
            {alerts.length === 0 ? (
              <div className="no-alerts">
                <div className="no-alerts-icon">✓</div>
                <h3>No alerts found</h3>
                <p>There are no alerts matching your current filters.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert-card severity-${alert.severity.toLowerCase()} status-${alert.status.toLowerCase()}`}
                >
                  <div className="alert-severity">
                    <span className="severity-icon">{getSeverityIcon(alert.severity)}</span>
                  </div>
                  <div className="alert-content">
                    <div className="alert-header">
                      <h3>{alert.title}</h3>
                      <div className="alert-badges">
                        <span className={`status-badge ${alert.status.toLowerCase()}`}>
                          {alert.status}
                        </span>
                        <span className="category-badge">
                          {getCategoryIcon(alert.category)} {alert.category}
                        </span>
                      </div>
                    </div>
                    <p className="alert-message">{alert.message}</p>
                    <div className="alert-meta">
                      <span className="meta-item">
                        <strong>Network:</strong> {alert.networkName}
                      </span>
                      <span className="meta-item">
                        <strong>Triggered:</strong> {formatTimeAgo(alert.triggeredAt)}
                      </span>
                      {alert.acknowledgedBy && (
                        <span className="meta-item">
                          <strong>Acknowledged by:</strong> {alert.acknowledgedBy}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="alert-actions">
                    {alert.status === 'ACTIVE' && (
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => handleAcknowledge(alert.id)}
                        loading={actionLoading === alert.id}
                      >
                        Acknowledge
                      </Button>
                    )}
                    {(alert.status === 'ACTIVE' || alert.status === 'ACKNOWLEDGED') && (
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => handleResolve(alert.id)}
                        loading={actionLoading === alert.id}
                      >
                        Resolve
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'rules' && (
        <div className="rules-list">
          {alertRules.map((rule) => (
            <div key={rule.id} className={`rule-card ${!rule.enabled ? 'disabled' : ''}`}>
              <div className="rule-header">
                <div className="rule-info">
                  <h3>{rule.name}</h3>
                  <p>{rule.description}</p>
                </div>
                <div className="rule-toggle">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id, rule.enabled)}
                      disabled={actionLoading === rule.id}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              <div className="rule-details">
                <div className="rule-condition">
                  <span className="condition-label">Condition:</span>
                  <span className="condition-value">
                    {rule.metric.replace(/_/g, ' ')} {getConditionText(rule.condition)} {rule.threshold}{rule.unit}
                  </span>
                </div>
                <div className="rule-severity">
                  <span className="severity-label">Severity:</span>
                  <span className={`severity-value ${rule.severity.toLowerCase()}`}>
                    {getSeverityIcon(rule.severity)} {rule.severity}
                  </span>
                </div>
                <div className="rule-networks">
                  <span className="networks-label">Networks:</span>
                  <span className="networks-value">
                    {rule.networks.includes('all') ? 'All Networks' : rule.networks.join(', ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <Modal
          title="Alert Details"
          onClose={() => setSelectedAlert(null)}
          size="medium"
        >
          <div className="alert-detail">
            <div className="detail-header">
              <span className="severity-icon large">{getSeverityIcon(selectedAlert.severity)}</span>
              <div className="detail-title">
                <h2>{selectedAlert.title}</h2>
                <span className={`status-badge ${selectedAlert.status.toLowerCase()}`}>
                  {selectedAlert.status}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Message</h4>
              <p>{selectedAlert.message}</p>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <label>Network</label>
                <span>{selectedAlert.networkName}</span>
              </div>
              <div className="detail-item">
                <label>Category</label>
                <span>{getCategoryIcon(selectedAlert.category)} {selectedAlert.category}</span>
              </div>
              <div className="detail-item">
                <label>Severity</label>
                <span className={`severity-value ${selectedAlert.severity.toLowerCase()}`}>
                  {selectedAlert.severity}
                </span>
              </div>
              <div className="detail-item">
                <label>Alert ID</label>
                <span className="monospace">{selectedAlert.id}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Timeline</h4>
              <div className="timeline">
                <div className="timeline-item">
                  <span className="timeline-label">Triggered</span>
                  <span className="timeline-value">
                    {new Date(selectedAlert.triggeredAt).toLocaleString()}
                  </span>
                </div>
                {selectedAlert.acknowledgedAt && (
                  <div className="timeline-item">
                    <span className="timeline-label">Acknowledged</span>
                    <span className="timeline-value">
                      {new Date(selectedAlert.acknowledgedAt).toLocaleString()} by {selectedAlert.acknowledgedBy}
                    </span>
                  </div>
                )}
                {selectedAlert.resolvedAt && (
                  <div className="timeline-item">
                    <span className="timeline-label">Resolved</span>
                    <span className="timeline-value">
                      {new Date(selectedAlert.resolvedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-actions">
              {selectedAlert.status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleAcknowledge(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                >
                  Acknowledge
                </Button>
              )}
              {(selectedAlert.status === 'ACTIVE' || selectedAlert.status === 'ACKNOWLEDGED') && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleResolve(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                >
                  Resolve
                </Button>
              )}
              <Button variant="ghost" onClick={() => setSelectedAlert(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Alerts;
