/**
 * Mock network data for fallback when backend is unavailable.
 * This is the single source of truth for mock data shape.
 */

const mockNetworks = [
  {
    id: 'net-001',
    name: 'Core Network Alpha',
    type: '5G',
    status: 'ACTIVE',
    region: 'US-EAST',
    ipRange: '10.0.0.0/16',
    bandwidth: '10 Gbps',
    latency: '2ms',
    nodes: 24,
    createdAt: '2024-01-15T10:30:00Z',
    description: 'Primary core network handling east coast traffic'
  },
  {
    id: 'net-002',
    name: 'Edge Network Beta',
    type: '4G LTE',
    status: 'ACTIVE',
    region: 'US-WEST',
    ipRange: '10.1.0.0/16',
    bandwidth: '5 Gbps',
    latency: '5ms',
    nodes: 18,
    createdAt: '2024-02-20T14:45:00Z',
    description: 'Edge network for west coast mobile users'
  },
  {
    id: 'net-003',
    name: 'Backup Network Gamma',
    type: '5G',
    status: 'STANDBY',
    region: 'US-CENTRAL',
    ipRange: '10.2.0.0/16',
    bandwidth: '8 Gbps',
    latency: '3ms',
    nodes: 12,
    createdAt: '2024-03-10T09:15:00Z',
    description: 'Disaster recovery and failover network'
  },
  {
    id: 'net-004',
    name: 'IoT Network Delta',
    type: 'NB-IoT',
    status: 'ACTIVE',
    region: 'US-SOUTH',
    ipRange: '10.3.0.0/16',
    bandwidth: '1 Gbps',
    latency: '15ms',
    nodes: 45,
    createdAt: '2024-04-05T16:20:00Z',
    description: 'Dedicated network for IoT device connectivity'
  },
  {
    id: 'net-005',
    name: 'Enterprise Network Epsilon',
    type: '5G Private',
    status: 'MAINTENANCE',
    region: 'US-NORTHEAST',
    ipRange: '10.4.0.0/16',
    bandwidth: '25 Gbps',
    latency: '1ms',
    nodes: 8,
    createdAt: '2024-05-12T11:00:00Z',
    description: 'Private 5G network for enterprise customers'
  }
];

export default mockNetworks;
