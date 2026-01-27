import React, { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '../../api/settings';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './Settings.css';

function Settings() {
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [saveStatus, setSaveStatus] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [settingsData, usersData, apiKeysData, logsData] = await Promise.all([
        settingsApi.getSettings(),
        settingsApi.getUsers(),
        settingsApi.getApiKeys(),
        settingsApi.getAuditLogs()
      ]);
      setSettings(settingsData);
      setUsers(usersData);
      setApiKeys(apiKeysData);
      setAuditLogs(logsData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = async (section) => {
    setActionLoading(true);
    setSaveStatus(null);
    try {
      await settingsApi.updateSettings(section, settings[section]);
      setSaveStatus({ type: 'success', message: 'Settings saved successfully' });
    } catch (err) {
      setSaveStatus({ type: 'error', message: 'Failed to save settings' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setActionLoading(true);
    try {
      const result = await settingsApi.createApiKey({
        name: formData.get('name'),
        permissions: formData.getAll('permissions')
      });
      setNewApiKey(result);
      await fetchData();
    } catch (err) {
      console.error('Failed to create API key:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeApiKey = async (keyId) => {
    setActionLoading(true);
    try {
      await settingsApi.revokeApiKey(keyId);
      await fetchData();
    } catch (err) {
      console.error('Failed to revoke API key:', err);
    } finally {
      setActionLoading(false);
      setConfirmDelete(null);
    }
  };

  const handleTestNotification = async (type) => {
    setActionLoading(true);
    try {
      await settingsApi.testNotification(type);
      setSaveStatus({ type: 'success', message: `Test ${type} notification sent` });
    } catch (err) {
      setSaveStatus({ type: 'error', message: `Failed to send test ${type} notification` });
    } finally {
      setActionLoading(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getActionIcon = (action) => {
    if (action.includes('delete')) return '🗑️';
    if (action.includes('create')) return '➕';
    if (action.includes('update')) return '✏️';
    if (action.includes('acknowledge')) return '✓';
    return '📝';
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Settings</h3>
        <p>{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <div className="header-left">
          <h1>Settings</h1>
          <p className="header-subtitle">Configure your NetOps platform</p>
        </div>
        {saveStatus && (
          <div className={`save-status ${saveStatus.type}`}>
            {saveStatus.type === 'success' ? '✓' : '✕'} {saveStatus.message}
          </div>
        )}
      </div>

      <div className="settings-layout">
        {/* Sidebar Navigation */}
        <nav className="settings-nav">
          <button
            className={`nav-item ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <span className="nav-icon">⚙️</span>
            General
          </button>
          <button
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <span className="nav-icon">🔔</span>
            Notifications
          </button>
          <button
            className={`nav-item ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoring')}
          >
            <span className="nav-icon">📊</span>
            Monitoring
          </button>
          <button
            className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span className="nav-icon">🔒</span>
            Security
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            Users
          </button>
          <button
            className={`nav-item ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <span className="nav-icon">🔑</span>
            API Keys
          </button>
          <button
            className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <span className="nav-icon">📋</span>
            Audit Log
          </button>
        </nav>

        {/* Content Area */}
        <div className="settings-content">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>General Settings</h2>
                <p>Basic configuration for your organization</p>
              </div>

              <div className="form-group">
                <label htmlFor="orgName">Organization Name</label>
                <input
                  id="orgName"
                  type="text"
                  value={settings.general.organizationName}
                  onChange={(e) => handleSettingChange('general', 'organizationName', e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="timezone">Timezone</label>
                  <select
                    id="timezone"
                    value={settings.general.timezone}
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                  >
                    <option value="America/New_York">Eastern Time (US)</option>
                    <option value="America/Chicago">Central Time (US)</option>
                    <option value="America/Denver">Mountain Time (US)</option>
                    <option value="America/Los_Angeles">Pacific Time (US)</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="dateFormat">Date Format</label>
                  <select
                    id="dateFormat"
                    value={settings.general.dateFormat}
                    onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="timeFormat">Time Format</label>
                  <select
                    id="timeFormat"
                    value={settings.general.timeFormat}
                    onChange={(e) => handleSettingChange('general', 'timeFormat', e.target.value)}
                  >
                    <option value="12h">12 Hour</option>
                    <option value="24h">24 Hour</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="theme">Theme</label>
                  <select
                    id="theme"
                    value={settings.general.theme}
                    onChange={(e) => handleSettingChange('general', 'theme', e.target.value)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>

              <div className="section-actions">
                <Button
                  variant="primary"
                  onClick={() => handleSaveSettings('general')}
                  loading={actionLoading}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Notification Settings</h2>
                <p>Configure how you receive alerts and notifications</p>
              </div>

              <div className="notification-channel">
                <div className="channel-header">
                  <div className="channel-info">
                    <h3>Email Notifications</h3>
                    <p>Receive alerts via email</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailEnabled}
                      onChange={(e) => handleSettingChange('notifications', 'emailEnabled', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                {settings.notifications.emailEnabled && (
                  <div className="channel-config">
                    <div className="form-group">
                      <label htmlFor="emailAddress">Email Address</label>
                      <input
                        id="emailAddress"
                        type="email"
                        value={settings.notifications.emailAddress}
                        onChange={(e) => handleSettingChange('notifications', 'emailAddress', e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleTestNotification('email')}
                      loading={actionLoading}
                    >
                      Send Test Email
                    </Button>
                  </div>
                )}
              </div>

              <div className="notification-channel">
                <div className="channel-header">
                  <div className="channel-info">
                    <h3>Slack Notifications</h3>
                    <p>Send alerts to a Slack channel</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications.slackEnabled}
                      onChange={(e) => handleSettingChange('notifications', 'slackEnabled', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                {settings.notifications.slackEnabled && (
                  <div className="channel-config">
                    <div className="form-group">
                      <label htmlFor="slackWebhook">Webhook URL</label>
                      <input
                        id="slackWebhook"
                        type="url"
                        value={settings.notifications.slackWebhook}
                        onChange={(e) => handleSettingChange('notifications', 'slackWebhook', e.target.value)}
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleTestNotification('slack')}
                      loading={actionLoading}
                    >
                      Send Test Message
                    </Button>
                  </div>
                )}
              </div>

              <div className="notification-channel">
                <div className="channel-header">
                  <div className="channel-info">
                    <h3>Alert Digest</h3>
                    <p>Receive a summary of alerts periodically</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications.alertDigestEnabled}
                      onChange={(e) => handleSettingChange('notifications', 'alertDigestEnabled', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                {settings.notifications.alertDigestEnabled && (
                  <div className="channel-config">
                    <div className="form-group">
                      <label htmlFor="digestFrequency">Frequency</label>
                      <select
                        id="digestFrequency"
                        value={settings.notifications.alertDigestFrequency}
                        onChange={(e) => handleSettingChange('notifications', 'alertDigestFrequency', e.target.value)}
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notifications.criticalAlertsOnly}
                    onChange={(e) => handleSettingChange('notifications', 'criticalAlertsOnly', e.target.checked)}
                  />
                  Only send notifications for critical alerts
                </label>
              </div>

              <div className="section-actions">
                <Button
                  variant="primary"
                  onClick={() => handleSaveSettings('notifications')}
                  loading={actionLoading}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Monitoring Settings */}
          {activeTab === 'monitoring' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Monitoring Settings</h2>
                <p>Configure data collection and retention</p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="refreshInterval">Default Refresh Interval</label>
                  <select
                    id="refreshInterval"
                    value={settings.monitoring.defaultRefreshInterval}
                    onChange={(e) => handleSettingChange('monitoring', 'defaultRefreshInterval', parseInt(e.target.value))}
                  >
                    <option value="15">15 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="60">1 minute</option>
                    <option value="300">5 minutes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="dataRetention">Data Retention</label>
                  <select
                    id="dataRetention"
                    value={settings.monitoring.dataRetentionDays}
                    onChange={(e) => handleSettingChange('monitoring', 'dataRetentionDays', parseInt(e.target.value))}
                  >
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="metricsResolution">Metrics Resolution</label>
                  <select
                    id="metricsResolution"
                    value={settings.monitoring.metricsResolution}
                    onChange={(e) => handleSettingChange('monitoring', 'metricsResolution', e.target.value)}
                  >
                    <option value="10s">10 seconds</option>
                    <option value="30s">30 seconds</option>
                    <option value="1m">1 minute</option>
                    <option value="5m">5 minutes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="healthCheckInterval">Health Check Interval</label>
                  <select
                    id="healthCheckInterval"
                    value={settings.monitoring.healthCheckInterval}
                    onChange={(e) => handleSettingChange('monitoring', 'healthCheckInterval', parseInt(e.target.value))}
                  >
                    <option value="30">30 seconds</option>
                    <option value="60">1 minute</option>
                    <option value="120">2 minutes</option>
                    <option value="300">5 minutes</option>
                  </select>
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.monitoring.enableAutoDiscovery}
                    onChange={(e) => handleSettingChange('monitoring', 'enableAutoDiscovery', e.target.checked)}
                  />
                  Enable automatic network discovery
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.monitoring.snmpEnabled}
                    onChange={(e) => handleSettingChange('monitoring', 'snmpEnabled', e.target.checked)}
                  />
                  Enable SNMP monitoring
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.monitoring.icmpEnabled}
                    onChange={(e) => handleSettingChange('monitoring', 'icmpEnabled', e.target.checked)}
                  />
                  Enable ICMP (ping) monitoring
                </label>
              </div>

              <div className="section-actions">
                <Button
                  variant="primary"
                  onClick={() => handleSaveSettings('monitoring')}
                  loading={actionLoading}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Security Settings</h2>
                <p>Manage security policies and access controls</p>
              </div>

              <div className="form-group">
                <label htmlFor="sessionTimeout">Session Timeout (minutes)</label>
                <input
                  id="sessionTimeout"
                  type="number"
                  min="5"
                  max="480"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.security.mfaEnabled}
                    onChange={(e) => handleSettingChange('security', 'mfaEnabled', e.target.checked)}
                  />
                  Require Multi-Factor Authentication (MFA)
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.security.auditLoggingEnabled}
                    onChange={(e) => handleSettingChange('security', 'auditLoggingEnabled', e.target.checked)}
                  />
                  Enable Audit Logging
                </label>
              </div>

              <div className="subsection">
                <h3>Password Policy</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="minLength">Minimum Length</label>
                    <input
                      id="minLength"
                      type="number"
                      min="8"
                      max="32"
                      value={settings.security.passwordPolicy.minLength}
                      onChange={(e) => handleSettingChange('security', 'passwordPolicy', {
                        ...settings.security.passwordPolicy,
                        minLength: parseInt(e.target.value)
                      })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="expirationDays">Password Expiration (days)</label>
                    <input
                      id="expirationDays"
                      type="number"
                      min="0"
                      max="365"
                      value={settings.security.passwordPolicy.expirationDays}
                      onChange={(e) => handleSettingChange('security', 'passwordPolicy', {
                        ...settings.security.passwordPolicy,
                        expirationDays: parseInt(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <div className="checkbox-grid">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.security.passwordPolicy.requireUppercase}
                      onChange={(e) => handleSettingChange('security', 'passwordPolicy', {
                        ...settings.security.passwordPolicy,
                        requireUppercase: e.target.checked
                      })}
                    />
                    Require uppercase letters
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.security.passwordPolicy.requireLowercase}
                      onChange={(e) => handleSettingChange('security', 'passwordPolicy', {
                        ...settings.security.passwordPolicy,
                        requireLowercase: e.target.checked
                      })}
                    />
                    Require lowercase letters
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.security.passwordPolicy.requireNumbers}
                      onChange={(e) => handleSettingChange('security', 'passwordPolicy', {
                        ...settings.security.passwordPolicy,
                        requireNumbers: e.target.checked
                      })}
                    />
                    Require numbers
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.security.passwordPolicy.requireSpecialChars}
                      onChange={(e) => handleSettingChange('security', 'passwordPolicy', {
                        ...settings.security.passwordPolicy,
                        requireSpecialChars: e.target.checked
                      })}
                    />
                    Require special characters
                  </label>
                </div>
              </div>

              <div className="section-actions">
                <Button
                  variant="primary"
                  onClick={() => handleSaveSettings('security')}
                  loading={actionLoading}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>User Management</h2>
                <p>Manage user accounts and permissions</p>
              </div>

              <div className="users-list">
                {users.map((user) => (
                  <div key={user.id} className={`user-card ${user.status === 'inactive' ? 'inactive' : ''}`}>
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <div className="user-role">
                      <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </div>
                    <div className="user-meta">
                      <span className="meta-label">Last login:</span>
                      <span className="meta-value">{formatTimeAgo(user.lastLogin)}</span>
                    </div>
                    <div className={`user-status ${user.status}`}>
                      {user.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Keys */}
          {activeTab === 'api' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>API Keys</h2>
                <p>Manage API keys for programmatic access</p>
                <Button variant="primary" onClick={() => setShowApiKeyModal(true)}>
                  Create API Key
                </Button>
              </div>

              <div className="api-keys-list">
                {apiKeys.map((key) => (
                  <div key={key.id} className="api-key-card">
                    <div className="key-icon">🔑</div>
                    <div className="key-info">
                      <div className="key-name">{key.name}</div>
                      <div className="key-prefix">{key.prefix}...</div>
                    </div>
                    <div className="key-permissions">
                      {key.permissions.map((perm) => (
                        <span key={perm} className="permission-badge">{perm}</span>
                      ))}
                    </div>
                    <div className="key-meta">
                      <div className="meta-row">
                        <span className="meta-label">Last used:</span>
                        <span className="meta-value">{formatTimeAgo(key.lastUsed)}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Expires:</span>
                        <span className="meta-value">{formatDate(key.expiresAt)}</span>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => setConfirmDelete(key)}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Log */}
          {activeTab === 'audit' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Audit Log</h2>
                <p>Review system activity and changes</p>
              </div>

              <div className="audit-log">
                {auditLogs.map((log) => (
                  <div key={log.id} className="audit-entry">
                    <div className="audit-icon">{getActionIcon(log.action)}</div>
                    <div className="audit-content">
                      <div className="audit-action">
                        <strong>{log.action}</strong> on {log.resource}
                      </div>
                      <div className="audit-details">{log.details}</div>
                      <div className="audit-meta">
                        <span>by {log.user}</span>
                        <span className="separator">•</span>
                        <span>{formatTimeAgo(log.timestamp)}</span>
                        <span className="separator">•</span>
                        <span>IP: {log.ip}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create API Key Modal */}
      {showApiKeyModal && (
        <Modal
          title={newApiKey ? "API Key Created" : "Create API Key"}
          onClose={() => {
            setShowApiKeyModal(false);
            setNewApiKey(null);
          }}
          size="medium"
        >
          {newApiKey ? (
            <div className="new-key-success">
              <div className="success-icon">✓</div>
              <h3>Your API Key</h3>
              <p className="warning-text">
                Copy this key now. You won't be able to see it again.
              </p>
              <div className="key-display">
                <code>{newApiKey.fullKey}</code>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  navigator.clipboard.writeText(newApiKey.fullKey);
                  setShowApiKeyModal(false);
                  setNewApiKey(null);
                }}
              >
                Copy and Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreateApiKey} className="create-key-form">
              <div className="form-group">
                <label htmlFor="keyName">Key Name</label>
                <input
                  id="keyName"
                  name="name"
                  type="text"
                  placeholder="e.g., Production API Key"
                  required
                />
              </div>
              <div className="form-group">
                <label>Permissions</label>
                <div className="checkbox-grid">
                  <label>
                    <input type="checkbox" name="permissions" value="read" defaultChecked />
                    Read
                  </label>
                  <label>
                    <input type="checkbox" name="permissions" value="write" />
                    Write
                  </label>
                  <label>
                    <input type="checkbox" name="permissions" value="delete" />
                    Delete
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowApiKeyModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={actionLoading}>
                  Create Key
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          title="Revoke API Key"
          message={`Are you sure you want to revoke "${confirmDelete.name}"? This action cannot be undone and any applications using this key will lose access.`}
          confirmText="Revoke"
          onConfirm={() => handleRevokeApiKey(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
          variant="danger"
        />
      )}
    </div>
  );
}

export default Settings;
