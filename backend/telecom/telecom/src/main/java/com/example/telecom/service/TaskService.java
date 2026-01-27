package com.example.telecom.service;

import com.example.telecom.model.Network;
import com.example.telecom.model.TaskInfo;
import com.example.telecom.repository.NetworkRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TaskService {

    private final ConcurrentHashMap<String, TaskInfo> tasks = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    private final NetworkRepository networkRepository;

    private static final String[] PROGRESS_MESSAGES = {
            "Initializing operation...",
            "Processing network configuration...",
            "Updating routing tables...",
            "Validating changes...",
            "Synchronizing with peers...",
            "Applying final configurations...",
            "Cleaning up resources...",
            "Verifying operation..."
    };

    public TaskService(NetworkRepository networkRepository) {
        this.networkRepository = networkRepository;
    }

    public String createTask(String type, String description, String networkId, String networkName) {
        String taskId = "task-" + UUID.randomUUID().toString().substring(0, 12);
        TaskInfo task = new TaskInfo(taskId, type, description, networkId, networkName);
        tasks.put(taskId, task);
        return taskId;
    }

    public TaskInfo getTask(String taskId) {
        return tasks.get(taskId);
    }

    /**
     * Register an SSE emitter for a task. If the task is already completed/failed,
     * sends the terminal event immediately.
     */
    public SseEmitter subscribe(String taskId) {
        SseEmitter emitter = new SseEmitter(300_000L); // 5 minute timeout

        emitter.onCompletion(() -> emitters.remove(taskId));
        emitter.onTimeout(() -> emitters.remove(taskId));
        emitter.onError(e -> emitters.remove(taskId));

        TaskInfo task = tasks.get(taskId);
        if (task == null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("error")
                        .data(Map.of("error", "Task not found", "message", "Task " + taskId + " does not exist")));
                emitter.complete();
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }

        // If task already finished, send terminal event immediately
        if ("COMPLETED".equals(task.getStatus())) {
            try {
                emitter.send(SseEmitter.event()
                        .name("complete")
                        .data(Map.of("taskId", taskId, "status", "COMPLETED", "message", "Operation completed successfully")));
                emitter.complete();
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }

        if ("FAILED".equals(task.getStatus())) {
            try {
                emitter.send(SseEmitter.event()
                        .name("error")
                        .data(Map.of("taskId", taskId, "error", task.getError(), "message", task.getMessage())));
                emitter.complete();
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }

        // Register emitter for future updates
        emitters.put(taskId, emitter);

        // Send current progress immediately
        try {
            emitter.send(SseEmitter.event()
                    .data(Map.of(
                            "taskId", taskId,
                            "progress", task.getProgress(),
                            "status", task.getStatus(),
                            "message", task.getMessage()
                    )));
        } catch (IOException e) {
            emitters.remove(taskId);
        }

        return emitter;
    }

    // ---- Async task executors ----

    @Async("taskExecutor")
    public void executeCreateNetwork(String taskId, Network network) {
        try {
            simulateProgress(taskId);

            // Perform the actual DB operation
            network.setCreatedAt(LocalDateTime.now());
            network.setUpdatedAt(LocalDateTime.now());
            networkRepository.save(network);

            completeTask(taskId);
        } catch (Exception e) {
            failTask(taskId, e.getMessage());
        }
    }

    @Async("taskExecutor")
    public void executeUpdateNetwork(String taskId, String networkId, Network networkDetails) {
        try {
            simulateProgress(taskId);

            // Perform the actual DB operation
            Network existing = networkRepository.findById(networkId).orElse(null);
            if (existing == null) {
                failTask(taskId, "Network not found");
                return;
            }
            existing.setName(networkDetails.getName());
            existing.setType(networkDetails.getType());
            existing.setStatus(networkDetails.getStatus());
            existing.setRegion(networkDetails.getRegion());
            existing.setIpRange(networkDetails.getIpRange());
            existing.setBandwidth(networkDetails.getBandwidth());
            existing.setLatency(networkDetails.getLatency());
            existing.setNodes(networkDetails.getNodes());
            existing.setDescription(networkDetails.getDescription());
            existing.setUpdatedAt(LocalDateTime.now());
            networkRepository.save(existing);

            completeTask(taskId);
        } catch (Exception e) {
            failTask(taskId, e.getMessage());
        }
    }

    @Async("taskExecutor")
    public void executeDeleteNetwork(String taskId, String networkId) {
        try {
            simulateProgress(taskId);

            // Perform the actual DB operation
            if (!networkRepository.existsById(networkId)) {
                failTask(taskId, "Network not found");
                return;
            }
            networkRepository.deleteById(networkId);

            completeTask(taskId);
        } catch (Exception e) {
            failTask(taskId, e.getMessage());
        }
    }

    // ---- Internal helpers ----

    private void simulateProgress(String taskId) {
        // Random duration between 1-3 minutes
        long totalDuration = 60_000L + (long) (Math.random() * 120_000L);
        long startTime = System.currentTimeMillis();

        while (true) {
            long elapsed = System.currentTimeMillis() - startTime;
            if (elapsed >= totalDuration) {
                break;
            }

            int progress = (int) Math.min((elapsed * 100) / totalDuration, 99);
            int messageIndex = Math.min(progress / 15, PROGRESS_MESSAGES.length - 1);

            long remainingSeconds = (totalDuration - elapsed) / 1000;
            String remainingMsg = remainingSeconds > 60
                    ? (remainingSeconds / 60) + "m " + (remainingSeconds % 60) + "s remaining"
                    : remainingSeconds + "s remaining";

            String message = PROGRESS_MESSAGES[messageIndex] + " (" + remainingMsg + ")";
            updateProgress(taskId, progress, message);

            try {
                Thread.sleep(3000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                failTask(taskId, "Task interrupted");
                return;
            }
        }

        // Final progress before completion
        updateProgress(taskId, 100, "Finalizing...");
    }

    private void updateProgress(String taskId, int progress, String message) {
        TaskInfo task = tasks.get(taskId);
        if (task == null) return;

        task.setStatus("IN_PROGRESS");
        task.setProgress(progress);
        task.setMessage(message);

        sendEvent(taskId, null, Map.of(
                "taskId", taskId,
                "progress", progress,
                "status", "IN_PROGRESS",
                "message", message
        ));
    }

    private void completeTask(String taskId) {
        TaskInfo task = tasks.get(taskId);
        if (task == null) return;

        task.setStatus("COMPLETED");
        task.setProgress(100);
        task.setMessage("Operation completed successfully");
        task.setCompletedAt(LocalDateTime.now());

        sendEvent(taskId, "complete", Map.of(
                "taskId", taskId,
                "status", "COMPLETED",
                "message", "Operation completed successfully"
        ));

        // Close the emitter after sending the complete event
        SseEmitter emitter = emitters.remove(taskId);
        if (emitter != null) {
            emitter.complete();
        }
    }

    private void failTask(String taskId, String error) {
        TaskInfo task = tasks.get(taskId);
        if (task == null) return;

        task.setStatus("FAILED");
        task.setError(error);
        task.setMessage("Operation failed: " + error);
        task.setCompletedAt(LocalDateTime.now());

        sendEvent(taskId, "error", Map.of(
                "taskId", taskId,
                "error", error != null ? error : "Unknown error",
                "message", "Operation failed: " + (error != null ? error : "Unknown error")
        ));

        SseEmitter emitter = emitters.remove(taskId);
        if (emitter != null) {
            emitter.complete();
        }
    }

    private void sendEvent(String taskId, String eventName, Map<String, Object> data) {
        SseEmitter emitter = emitters.get(taskId);
        if (emitter == null) return;

        try {
            SseEmitter.SseEventBuilder event = SseEmitter.event().data(data);
            if (eventName != null) {
                event.name(eventName);
            }
            emitter.send(event);
        } catch (IOException e) {
            emitters.remove(taskId);
        }
    }
}
