/**
 * Reusable hook for SSE task progress subscription
 * This hook provides a simple interface to track a specific task's progress
 */

import { useState, useEffect, useCallback } from 'react';
import sseManager from '../api/sse';

export const TaskProgressStatus = {
  IDLE: 'IDLE',
  CONNECTING: 'CONNECTING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

export function useSSETaskProgress(taskId, options = {}) {
  const { autoSubscribe = true, onComplete, onError, onProgress } = options;

  const [status, setStatus] = useState(TaskProgressStatus.IDLE);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const subscribe = useCallback(() => {
    if (!taskId) return () => {};

    setStatus(TaskProgressStatus.CONNECTING);

    const unsubscribe = sseManager.subscribe(taskId, {
      onConnect: () => {
        setIsConnected(true);
        setStatus(TaskProgressStatus.IN_PROGRESS);
      },
      onProgress: (data) => {
        setProgress(data.progress ?? 0);
        setMessage(data.message ?? '');
        setStatus(TaskProgressStatus.IN_PROGRESS);
        if (onProgress) onProgress(data);
      },
      onComplete: (data) => {
        setStatus(TaskProgressStatus.COMPLETED);
        setProgress(100);
        setMessage(data.message ?? 'Completed');
        setIsConnected(false);
        if (onComplete) onComplete(data);
      },
      onError: (data) => {
        setStatus(TaskProgressStatus.FAILED);
        setError(data.error ?? 'An error occurred');
        setMessage(data.message ?? 'Operation failed');
        setIsConnected(false);
        if (onError) onError(data);
      },
      onMaxRetriesExceeded: () => {
        setStatus(TaskProgressStatus.FAILED);
        setError('Connection lost');
        setMessage('Unable to track progress - connection failed');
        setIsConnected(false);
        if (onError) onError({ error: 'Connection lost' });
      }
    });

    return unsubscribe;
  }, [taskId, onComplete, onError, onProgress]);

  useEffect(() => {
    if (!taskId || !autoSubscribe) return;

    const unsubscribe = subscribe();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [taskId, autoSubscribe, subscribe]);

  const reset = useCallback(() => {
    setStatus(TaskProgressStatus.IDLE);
    setProgress(0);
    setMessage('');
    setError(null);
    setIsConnected(false);
  }, []);

  return {
    status,
    progress,
    message,
    error,
    isConnected,
    isIdle: status === TaskProgressStatus.IDLE,
    isConnecting: status === TaskProgressStatus.CONNECTING,
    isInProgress: status === TaskProgressStatus.IN_PROGRESS,
    isCompleted: status === TaskProgressStatus.COMPLETED,
    isFailed: status === TaskProgressStatus.FAILED,
    subscribe,
    reset
  };
}

export default useSSETaskProgress;
