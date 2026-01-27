/**
 * Network Form component for creating and editing networks
 */

import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import './NetworkForm.css';

const networkTypes = ['5G', '4G LTE', '5G Private', 'NB-IoT', 'LTE-M', 'Fiber'];
const networkStatuses = ['ACTIVE', 'STANDBY', 'MAINTENANCE', 'INACTIVE'];
const regions = ['US-EAST', 'US-WEST', 'US-CENTRAL', 'US-SOUTH', 'US-NORTHEAST', 'EU-WEST', 'EU-CENTRAL', 'ASIA-PACIFIC'];

const initialFormData = {
  name: '',
  type: '5G',
  status: 'ACTIVE',
  region: 'US-EAST',
  ipRange: '',
  bandwidth: '',
  latency: '',
  nodes: '',
  description: ''
};

export function NetworkForm({ isOpen, onClose, onSubmit, network, loading }) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const isEditing = !!network;

  useEffect(() => {
    if (network) {
      setFormData({
        name: network.name || '',
        type: network.type || '5G',
        status: network.status || 'ACTIVE',
        region: network.region || 'US-EAST',
        ipRange: network.ipRange || '',
        bandwidth: network.bandwidth || '',
        latency: network.latency || '',
        nodes: network.nodes?.toString() || '',
        description: network.description || ''
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [network, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Network name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Network name must be at least 3 characters';
    }

    if (!formData.ipRange.trim()) {
      newErrors.ipRange = 'IP range is required';
    } else if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/.test(formData.ipRange)) {
      newErrors.ipRange = 'Invalid CIDR format (e.g., 10.0.0.0/16)';
    }

    if (!formData.bandwidth.trim()) {
      newErrors.bandwidth = 'Bandwidth is required';
    }

    if (!formData.latency.trim()) {
      newErrors.latency = 'Latency is required';
    }

    if (!formData.nodes.trim()) {
      newErrors.nodes = 'Number of nodes is required';
    } else if (isNaN(parseInt(formData.nodes)) || parseInt(formData.nodes) < 1) {
      newErrors.nodes = 'Must be a positive number';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    const submitData = {
      ...formData,
      nodes: parseInt(formData.nodes)
    };

    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Network' : 'Create New Network'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="network-form">
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-group">
            <label htmlFor="name">Network Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter network name"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Network Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                {networkTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                {networkStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="region">Region *</label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
              >
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Network Configuration</h3>

          <div className="form-group">
            <label htmlFor="ipRange">IP Range (CIDR) *</label>
            <input
              id="ipRange"
              name="ipRange"
              type="text"
              value={formData.ipRange}
              onChange={handleChange}
              placeholder="e.g., 10.0.0.0/16"
              className={errors.ipRange ? 'error' : ''}
            />
            {errors.ipRange && <span className="error-message">{errors.ipRange}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bandwidth">Bandwidth *</label>
              <input
                id="bandwidth"
                name="bandwidth"
                type="text"
                value={formData.bandwidth}
                onChange={handleChange}
                placeholder="e.g., 10 Gbps"
                className={errors.bandwidth ? 'error' : ''}
              />
              {errors.bandwidth && <span className="error-message">{errors.bandwidth}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="latency">Latency *</label>
              <input
                id="latency"
                name="latency"
                type="text"
                value={formData.latency}
                onChange={handleChange}
                placeholder="e.g., 2ms"
                className={errors.latency ? 'error' : ''}
              />
              {errors.latency && <span className="error-message">{errors.latency}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="nodes">Number of Nodes *</label>
              <input
                id="nodes"
                name="nodes"
                type="number"
                min="1"
                value={formData.nodes}
                onChange={handleChange}
                placeholder="e.g., 24"
                className={errors.nodes ? 'error' : ''}
              />
              {errors.nodes && <span className="error-message">{errors.nodes}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Description</h3>

          <div className="form-group">
            <label htmlFor="description">Network Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter a description of this network..."
              rows={3}
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>
        </div>

        <div className="form-actions">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditing ? 'Update Network' : 'Create Network'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default NetworkForm;
