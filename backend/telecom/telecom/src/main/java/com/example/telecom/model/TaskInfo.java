package com.example.telecom.model;

import java.time.LocalDateTime;

/**
 * In-memory representation of an async task (not a JPA entity).
 */
public class TaskInfo {

    private String id;
    private String type;
    private String description;
    private String status;      // PENDING, IN_PROGRESS, COMPLETED, FAILED
    private int progress;
    private String message;
    private String networkId;
    private String networkName;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private String error;

    public TaskInfo() {
    }

    public TaskInfo(String id, String type, String description, String networkId, String networkName) {
        this.id = id;
        this.type = type;
        this.description = description;
        this.networkId = networkId;
        this.networkName = networkName;
        this.status = "PENDING";
        this.progress = 0;
        this.message = "Starting...";
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getProgress() {
        return progress;
    }

    public void setProgress(int progress) {
        this.progress = progress;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getNetworkId() {
        return networkId;
    }

    public void setNetworkId(String networkId) {
        this.networkId = networkId;
    }

    public String getNetworkName() {
        return networkName;
    }

    public void setNetworkName(String networkName) {
        this.networkName = networkName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
