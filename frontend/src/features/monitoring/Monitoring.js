import React, { useState, useEffect, useCallback } from 'react';
import { monitoringApi } from '../../api/monitoring';
import Button from '../../components/common/Button';
import ProgressBar from '../../components/common/ProgressBar';
import './Monitoring.css';

function Monitoring() {
  const [healthSummary, setHealthSummary] = useState(null);
  const [networkHealth, setNetworkHealth] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [summaryData, healthData, metricsData] = await Promise.all([
        monitoringApi.getHealthSummary(),
        monitoringApi.getNetworkHealth(),
        monitoringApi.getMetrics()
      ]);
      setHealthSummary(summaryData);
      setNetworkHealth(healthData);
      setMetrics(metricsData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'HEALTHY':
      case 'NORMAL':
        return 'status-healthy';
      case 'WARNING':
        return 'status-warning';
      case 'CRITICAL':
        return 'status-critical';
      default:
        return 'status-unknown';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'stable':
        return '→';
      default:
        return '';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getMetricIcon = (type) => {
    switch (type) {
      case 'bandwidth':
        return '📶';
      case 'latency':
        return '⏱️';
      case 'packet_loss':
        return '📉';
      case 'throughput':
        return '📊';
      case 'cpu_usage':
        return '💻';
      case 'memory_usage':
        return '🧠';
      default:
        return '📈';
    }
  };

  if (loading) {
    return (
      <div className="monitoring-loading">
        <div className="spinner"></div>
        <p>Loading monitoring data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="monitoring-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="monitoring">
      <div className="monitoring-header">
        <div className="header-left">
          <h1>Network Monitoring</h1>
          <p className="header-subtitle">Real-time health and performance metrics</p>
        </div>
        <div className="header-right">
          <div className="auto-refresh-toggle">
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh (30s)
            </label>
          </div>
          <Button variant="outline" onClick={fetchData}>
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Health Summary Cards */}
      <div className="health-summary">
        <div className="summary-card overall-health">
          <div className="summary-icon">🏥</div>
          <div className="summary-content">
            <span className="summary-value">{healthSummary?.overallHealth}%</span>
            <span className="summary-label">Overall Health</span>
          </div>
          <ProgressBar
            progress={healthSummary?.overallHealth || 0}
            variant={healthSummary?.overallHealth >= 80 ? 'primary' : 'warning'}
          />
        </div>

        <div className="summary-card">
          <div className="summary-icon healthy">✓</div>
          <div className="summary-content">
            <span className="summary-value">{healthSummary?.healthyNetworks}</span>
            <span className="summary-label">Healthy Networks</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon warning">⚠</div>
          <div className="summary-content">
            <span className="summary-value">{healthSummary?.warningNetworks}</span>
            <span className="summary-label">Warnings</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon critical">✕</div>
          <div className="summary-content">
            <span className="summary-value">{healthSummary?.criticalNetworks}</span>
            <span className="summary-label">Critical</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon nodes">🖥</div>
          <div className="summary-content">
            <span className="summary-value">
              {healthSummary?.activeNodes}/{healthSummary?.totalNodes}
            </span>
            <span className="summary-label">Active Nodes</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="monitoring-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Network Health
        </button>
        <button
          className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Live Metrics
        </button>
      </div>

      {/* Tab Content */}
      <div className="monitoring-content">
        {activeTab === 'overview' && (
          <div className="network-health-grid">
            {networkHealth.map((network) => (
              <div key={network.id} className="network-health-card">
                <div className="network-health-header">
                  <div className="network-info">
                    <h3>{network.name}</h3>
                    <span className="network-type">{network.type}</span>
                  </div>
                  <div className={`health-badge ${getStatusColor(network.status)}`}>
                    {network.status}
                  </div>
                </div>

                <div className="health-score">
                  <div className="score-circle">
                    <svg viewBox="0 0 36 36">
                      <path
                        className="score-bg"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={`score-fill ${getStatusColor(network.status)}`}
                        strokeDasharray={`${network.health}, 100`}
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="score-value">{network.health}%</span>
                  </div>
                </div>

                <div className="network-stats">
                  <div className="stat">
                    <span className="stat-label">Nodes</span>
                    <span className="stat-value">
                      {network.activeNodes}/{network.totalNodes}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Uptime</span>
                    <span className="stat-value">{network.uptime}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Last Incident</span>
                    <span className="stat-value">{formatTimeAgo(network.lastIncident)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="metrics-grid">
            {metrics.map((metric) => (
              <div key={metric.id} className="metric-card">
                <div className="metric-header">
                  <span className="metric-icon">{getMetricIcon(metric.type)}</span>
                  <div className="metric-info">
                    <span className="metric-type">
                      {metric.type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="metric-network">{metric.networkName}</span>
                  </div>
                  <div className={`metric-status ${getStatusColor(metric.status)}`}>
                    {metric.status}
                  </div>
                </div>

                <div className="metric-value-container">
                  <span className="metric-value">{metric.value}</span>
                  <span className="metric-unit">{metric.unit}</span>
                  <span className={`metric-trend ${metric.trend}`}>
                    {getTrendIcon(metric.trend)} {metric.trendPercent}%
                  </span>
                </div>

                <div className="metric-threshold">
                  <span className="threshold-label">Threshold: {metric.threshold}{metric.unit}</span>
                  <ProgressBar
                    progress={(metric.value / metric.threshold) * 100}
                    size="small"
                    variant={metric.status === 'NORMAL' ? 'primary' : 'warning'}
                  />
                </div>

                <div className="metric-footer">
                  <span className="last-updated">Updated {formatTimeAgo(metric.lastUpdated)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last Updated Footer */}
      <div className="monitoring-footer">
        <span>Last updated: {healthSummary?.lastUpdated ? new Date(healthSummary.lastUpdated).toLocaleString() : 'N/A'}</span>
      </div>
    </div>
  );
}

export default Monitoring;
