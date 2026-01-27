/**
 * Individual Task display component
 */

import React from 'react';
import { TaskStatus } from '../../context/TaskContext';
import TaskStatusBadge from './TaskStatusBadge';
import ProgressBar from '../common/ProgressBar';
import Button from '../common/Button';
import './TaskItem.css';

export function TaskItem({ task, onDismiss, compact = false }) {
  const isActive = task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.PENDING;
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isFailed = task.status === TaskStatus.FAILED;

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`task-item ${compact ? 'task-item-compact' : ''} task-item-${task.status.toLowerCase()}`}>
      <div className="task-item-header">
        <div className="task-item-info">
          <span className="task-item-type">{task.type}</span>
          <TaskStatusBadge status={task.status} size="small" />
        </div>
        {!isActive && onDismiss && (
          <button
            className="task-item-dismiss"
            onClick={() => onDismiss(task.id)}
            aria-label="Dismiss task"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M11 3L3 11M3 3l8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      <p className="task-item-description">{task.description}</p>

      {isActive && (
        <div className="task-item-progress">
          <ProgressBar
            progress={task.progress}
            size="small"
            variant="primary"
            animated={true}
          />
          <span className="task-item-percentage">{task.progress}%</span>
        </div>
      )}

      <div className="task-item-footer">
        <span className="task-item-message">{task.message}</span>
        <span className="task-item-time">
          {formatTime(task.completedAt || task.startedAt)}
        </span>
      </div>

      {isFailed && task.error && (
        <div className="task-item-error">
          {task.error}
        </div>
      )}

      {(isCompleted || isFailed) && !compact && onDismiss && (
        <div className="task-item-actions">
          <Button
            variant="ghost"
            size="small"
            onClick={() => onDismiss(task.id)}
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}

export default TaskItem;
