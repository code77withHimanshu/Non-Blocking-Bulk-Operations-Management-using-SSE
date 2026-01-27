/**
 * SSE Connection Manager with reconnection logic and exponential backoff
 */

const SSE_BASE_URL = process.env.REACT_APP_SSE_URL || 'http://localhost:8080/api/tasks';
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;

// Check if we're in mock mode (defaults to real backend)
const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'true';

class SSEConnection {
  constructor(taskId, handlers) {
    this.taskId = taskId;
    this.handlers = handlers;
    this.eventSource = null;
    this.retryCount = 0;
    this.retryDelay = INITIAL_RETRY_DELAY;
    this.isClosed = false;
  }

  connect() {
    if (this.isClosed) return;

    const url = `${SSE_BASE_URL}/${this.taskId}/progress`;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.retryCount = 0;
        this.retryDelay = INITIAL_RETRY_DELAY;
        if (this.handlers.onConnect) {
          this.handlers.onConnect();
        }
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.handlers.onProgress) {
            this.handlers.onProgress(data);
          }
        } catch (error) {
          console.error('SSE parse error:', error);
        }
      };

      this.eventSource.addEventListener('complete', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.handlers.onComplete) {
            this.handlers.onComplete(data);
          }
          this.close();
        } catch (error) {
          console.error('SSE complete parse error:', error);
        }
      });

      this.eventSource.addEventListener('error', (event) => {
        if (event.data) {
          try {
            const data = JSON.parse(event.data);
            if (this.handlers.onError) {
              this.handlers.onError(data);
            }
            this.close();
            return;
          } catch (e) {
            // Not a JSON error event, handle as connection error
          }
        }
        this.handleConnectionError();
      });

      this.eventSource.onerror = () => {
        this.handleConnectionError();
      };
    } catch (error) {
      this.handleConnectionError();
    }
  }

  handleConnectionError() {
    if (this.isClosed) return;

    this.eventSource?.close();
    this.retryCount++;

    if (this.retryCount > MAX_RETRIES) {
      if (this.handlers.onMaxRetriesExceeded) {
        this.handlers.onMaxRetriesExceeded();
      }
      this.close();
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    setTimeout(() => {
      if (!this.isClosed) {
        this.connect();
      }
    }, this.retryDelay);

    this.retryDelay *= 2;
  }

  close() {
    this.isClosed = true;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

/**
 * Mock SSE Connection for testing without backend
 * Simulates long-running operations (1-3 minutes)
 */
class MockSSEConnection {
  constructor(taskId, handlers) {
    this.taskId = taskId;
    this.handlers = handlers;
    this.isClosed = false;
    this.intervalId = null;
    this.progress = 0;
    // Random duration between 1-3 minutes (in milliseconds)
    this.totalDuration = Math.floor(Math.random() * 120000) + 60000; // 60000-180000ms
    this.startTime = null;
  }

  connect() {
    if (this.isClosed) return;

    // Simulate connection
    setTimeout(() => {
      if (this.handlers.onConnect) {
        this.handlers.onConnect();
      }
      this.startProgressSimulation();
    }, 100);
  }

  startProgressSimulation() {
    // Determine if this task will fail (10% chance)
    const willFail = Math.random() < 0.1;
    const failAtProgress = willFail ? Math.floor(Math.random() * 70) + 20 : null;

    this.startTime = Date.now();
    // Update interval: every 3 seconds for smoother progress over 1-3 minutes
    const updateInterval = 3000;

    console.log(`[Mock SSE] Task ${this.taskId} will take ${Math.round(this.totalDuration / 1000)} seconds`);

    this.intervalId = setInterval(() => {
      if (this.isClosed) {
        clearInterval(this.intervalId);
        return;
      }

      // Calculate progress based on elapsed time
      const elapsed = Date.now() - this.startTime;
      this.progress = Math.min(Math.floor((elapsed / this.totalDuration) * 100), 99);

      // Check if should fail
      if (failAtProgress && this.progress >= failAtProgress) {
        clearInterval(this.intervalId);
        if (this.handlers.onError) {
          this.handlers.onError({
            error: 'Network operation failed',
            message: 'Unable to complete the operation due to a network error'
          });
        }
        this.close();
        return;
      }

      // Check if complete
      if (elapsed >= this.totalDuration) {
        this.progress = 100;
        clearInterval(this.intervalId);

        if (this.handlers.onProgress) {
          this.handlers.onProgress({
            taskId: this.taskId,
            progress: 100,
            status: 'IN_PROGRESS',
            message: 'Finalizing...'
          });
        }

        // Send completion after short delay
        setTimeout(() => {
          if (!this.isClosed && this.handlers.onComplete) {
            this.handlers.onComplete({
              taskId: this.taskId,
              status: 'COMPLETED',
              message: 'Operation completed successfully'
            });
          }
          this.close();
        }, 500);
        return;
      }

      // Send progress update
      if (this.handlers.onProgress) {
        const messages = [
          'Initializing operation...',
          'Processing network configuration...',
          'Updating routing tables...',
          'Validating changes...',
          'Synchronizing with peers...',
          'Applying final configurations...',
          'Cleaning up resources...',
          'Verifying operation...'
        ];
        const messageIndex = Math.min(
          Math.floor(this.progress / 15),
          messages.length - 1
        );

        // Show remaining time in message
        const remainingSeconds = Math.round((this.totalDuration - elapsed) / 1000);
        const remainingMsg = remainingSeconds > 60
          ? `${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s remaining`
          : `${remainingSeconds}s remaining`;

        this.handlers.onProgress({
          taskId: this.taskId,
          progress: this.progress,
          status: 'IN_PROGRESS',
          message: `${messages[messageIndex]} (${remainingMsg})`
        });
      }
    }, updateInterval);
  }

  close() {
    this.isClosed = true;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

/**
 * SSE Manager - manages all active SSE connections
 */
class SSEManager {
  constructor() {
    this.connections = new Map();
  }

  subscribe(taskId, handlers) {
    // Close existing connection for this task if any
    this.unsubscribe(taskId);

    const ConnectionClass = USE_MOCK ? MockSSEConnection : SSEConnection;
    const connection = new ConnectionClass(taskId, handlers);
    this.connections.set(taskId, connection);
    connection.connect();

    return () => this.unsubscribe(taskId);
  }

  unsubscribe(taskId) {
    const connection = this.connections.get(taskId);
    if (connection) {
      connection.close();
      this.connections.delete(taskId);
    }
  }

  unsubscribeAll() {
    this.connections.forEach((connection) => connection.close());
    this.connections.clear();
  }
}

// Singleton instance
export const sseManager = new SSEManager();
export { SSEConnection, MockSSEConnection };
export default sseManager;
