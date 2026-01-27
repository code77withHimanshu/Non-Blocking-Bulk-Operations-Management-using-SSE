/**
 * Global floating Task Progress Panel
 * Shows all active and recent tasks
 */

import React, { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import TaskItem from './TaskItem';
import Button from '../common/Button';
import './TaskProgressPanel.css';

export function TaskProgressPanel() {
  const {
    activeTasks,
    completedTasks,
    hasActiveTasks,
    hasCompletedTasks,
    dismissTask,
    clearCompleted
  } = useTaskContext();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const totalTasks = activeTasks.length + completedTasks.length;

  // Don't render if no tasks
  if (totalTasks === 0) {
    return null;
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className={`task-panel ${isMinimized ? 'task-panel-minimized' : ''}`}>
      <div className="task-panel-header" onClick={toggleExpanded}>
        <div className="task-panel-title">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 1.5v15M1.5 9h15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>Tasks</span>
          {hasActiveTasks && (
            <span className="task-panel-badge">{activeTasks.length}</span>
          )}
        </div>
        <div className="task-panel-controls">
          <button
            className="task-panel-control"
            onClick={(e) => { e.stopPropagation(); toggleMinimized(); }}
            aria-label={isMinimized ? 'Expand panel' : 'Minimize panel'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              {isMinimized ? (
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M3 9l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="task-panel-body">
          {isExpanded ? (
            <>
              {/* Active Tasks */}
              {hasActiveTasks && (
                <div className="task-panel-section">
                  <h4 className="task-panel-section-title">Active</h4>
                  <div className="task-panel-list">
                    {activeTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        compact={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {hasCompletedTasks && (
                <div className="task-panel-section">
                  <div className="task-panel-section-header">
                    <h4 className="task-panel-section-title">Recent</h4>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={clearCompleted}
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="task-panel-list">
                    {completedTasks.slice(-5).reverse().map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onDismiss={dismissTask}
                        compact={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="task-panel-summary">
              <span>{activeTasks.length} active</span>
              <span className="task-panel-summary-divider">|</span>
              <span>{completedTasks.length} completed</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskProgressPanel;
