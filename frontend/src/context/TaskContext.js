/**
 * Global Task State Management with built-in SSE subscription
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import sseManager from '../api/sse';

// Task statuses
export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

// Action types
const ActionTypes = {
  TASK_STARTED: 'TASK_STARTED',
  TASK_PROGRESS: 'TASK_PROGRESS',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_FAILED: 'TASK_FAILED',
  TASK_DISMISSED: 'TASK_DISMISSED',
  CLEAR_COMPLETED: 'CLEAR_COMPLETED'
};

// Initial state
const initialState = {
  tasks: {},
  activeTaskIds: [],
  completedTaskIds: []
};

// Reducer
function taskReducer(state, action) {
  switch (action.type) {
    case ActionTypes.TASK_STARTED: {
      const { taskId, taskType, description, metadata } = action.payload;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            id: taskId,
            type: taskType,
            description,
            metadata,
            status: TaskStatus.PENDING,
            progress: 0,
            message: 'Starting...',
            startedAt: new Date().toISOString(),
            error: null
          }
        },
        activeTaskIds: [...state.activeTaskIds, taskId]
      };
    }

    case ActionTypes.TASK_PROGRESS: {
      const { taskId, progress, message, status } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return state;

      return {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            progress: progress ?? task.progress,
            message: message ?? task.message,
            status: status ?? TaskStatus.IN_PROGRESS
          }
        }
      };
    }

    case ActionTypes.TASK_COMPLETED: {
      const { taskId, message } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return state;

      return {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            status: TaskStatus.COMPLETED,
            progress: 100,
            message: message ?? 'Completed successfully',
            completedAt: new Date().toISOString()
          }
        },
        activeTaskIds: state.activeTaskIds.filter(id => id !== taskId),
        completedTaskIds: [...state.completedTaskIds, taskId]
      };
    }

    case ActionTypes.TASK_FAILED: {
      const { taskId, error, message } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return state;

      return {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            status: TaskStatus.FAILED,
            error: error ?? 'An error occurred',
            message: message ?? 'Operation failed',
            completedAt: new Date().toISOString()
          }
        },
        activeTaskIds: state.activeTaskIds.filter(id => id !== taskId),
        completedTaskIds: [...state.completedTaskIds, taskId]
      };
    }

    case ActionTypes.TASK_DISMISSED: {
      const { taskId } = action.payload;
      const newTasks = { ...state.tasks };
      delete newTasks[taskId];

      return {
        ...state,
        tasks: newTasks,
        completedTaskIds: state.completedTaskIds.filter(id => id !== taskId)
      };
    }

    case ActionTypes.CLEAR_COMPLETED: {
      const newTasks = { ...state.tasks };
      state.completedTaskIds.forEach(id => {
        delete newTasks[id];
      });

      return {
        ...state,
        tasks: newTasks,
        completedTaskIds: []
      };
    }

    default:
      return state;
  }
}

// Context
const TaskContext = createContext(null);

// Provider component
export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const sseSubscriptions = useRef(new Map());

  // Subscribe to SSE for a task
  const subscribeToTask = useCallback((taskId) => {
    if (sseSubscriptions.current.has(taskId)) return;

    const unsubscribe = sseManager.subscribe(taskId, {
      onConnect: () => {
        dispatch({
          type: ActionTypes.TASK_PROGRESS,
          payload: { taskId, status: TaskStatus.IN_PROGRESS, message: 'Connected...' }
        });
      },
      onProgress: (data) => {
        dispatch({
          type: ActionTypes.TASK_PROGRESS,
          payload: {
            taskId,
            progress: data.progress,
            message: data.message,
            status: TaskStatus.IN_PROGRESS
          }
        });
      },
      onComplete: (data) => {
        dispatch({
          type: ActionTypes.TASK_COMPLETED,
          payload: { taskId, message: data.message }
        });
        sseSubscriptions.current.delete(taskId);
      },
      onError: (data) => {
        dispatch({
          type: ActionTypes.TASK_FAILED,
          payload: { taskId, error: data.error, message: data.message }
        });
        sseSubscriptions.current.delete(taskId);
      },
      onMaxRetriesExceeded: () => {
        dispatch({
          type: ActionTypes.TASK_FAILED,
          payload: {
            taskId,
            error: 'Connection lost',
            message: 'Unable to track task progress - connection failed'
          }
        });
        sseSubscriptions.current.delete(taskId);
      }
    });

    sseSubscriptions.current.set(taskId, unsubscribe);
  }, []);

  // Start a new task
  const startTask = useCallback((taskId, taskType, description, metadata = {}) => {
    dispatch({
      type: ActionTypes.TASK_STARTED,
      payload: { taskId, taskType, description, metadata }
    });

    // Automatically subscribe to SSE for this task
    subscribeToTask(taskId);
  }, [subscribeToTask]);

  // Dismiss a completed/failed task
  const dismissTask = useCallback((taskId) => {
    dispatch({
      type: ActionTypes.TASK_DISMISSED,
      payload: { taskId }
    });
  }, []);

  // Clear all completed tasks
  const clearCompleted = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_COMPLETED });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sseSubscriptions.current.forEach((unsubscribe) => unsubscribe());
      sseSubscriptions.current.clear();
    };
  }, []);

  const value = {
    tasks: state.tasks,
    activeTaskIds: state.activeTaskIds,
    completedTaskIds: state.completedTaskIds,
    activeTasks: state.activeTaskIds.map(id => state.tasks[id]).filter(Boolean),
    completedTasks: state.completedTaskIds.map(id => state.tasks[id]).filter(Boolean),
    allTasks: Object.values(state.tasks),
    hasActiveTasks: state.activeTaskIds.length > 0,
    hasCompletedTasks: state.completedTaskIds.length > 0,
    startTask,
    dismissTask,
    clearCompleted
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

// Hook to use task context
export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}

export default TaskContext;
