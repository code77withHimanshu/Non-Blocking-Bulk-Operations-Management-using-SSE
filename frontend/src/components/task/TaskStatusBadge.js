/**
 * Task Status Badge component
 */

import React from 'react';
import { TaskStatus } from '../../context/TaskContext';
import './TaskStatusBadge.css';

const statusConfig = {
  [TaskStatus.PENDING]: {
    label: 'Pending',
    className: 'badge-pending'
  },
  [TaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    className: 'badge-in-progress'
  },
  [TaskStatus.COMPLETED]: {
    label: 'Completed',
    className: 'badge-completed'
  },
  [TaskStatus.FAILED]: {
    label: 'Failed',
    className: 'badge-failed'
  }
};

export function TaskStatusBadge({ status, size = 'medium' }) {
  const config = statusConfig[status] || statusConfig[TaskStatus.PENDING];

  return (
    <span className={`task-status-badge ${config.className} badge-${size}`}>
      {status === TaskStatus.IN_PROGRESS && (
        <span className="badge-spinner" />
      )}
      {config.label}
    </span>
  );
}

export default TaskStatusBadge;
