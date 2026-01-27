package com.example.telecom.controller;

import com.example.telecom.model.Network;
import com.example.telecom.model.NetworkStatus;
import com.example.telecom.service.NetworkService;
import com.example.telecom.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/networks")
public class NetworkController {

    private final NetworkService networkService;
    private final TaskService taskService;

    public NetworkController(NetworkService networkService, TaskService taskService) {
        this.networkService = networkService;
        this.taskService = taskService;
    }

    // --- Read operations remain synchronous ---

    @GetMapping
    public List<Network> getAllNetworks() {
        return networkService.getAllNetworks();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Network> getNetworkById(@PathVariable String id) {
        return networkService.getNetworkById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<Network> getNetworksByStatus(@PathVariable NetworkStatus status) {
        return networkService.getNetworksByStatus(status);
    }

    // --- Write operations are async (fire-and-forget with SSE progress) ---

    @PostMapping
    public ResponseEntity<Map<String, Object>> createNetwork(@RequestBody Network network) {
        // Generate ID upfront so we can return it immediately
        String networkId = "net-" + UUID.randomUUID().toString().substring(0, 8);
        network.setId(networkId);

        String taskId = taskService.createTask(
                "CREATE_NETWORK",
                "Creating network \"" + network.getName() + "\"",
                networkId,
                network.getName()
        );

        // Fire async execution
        taskService.executeCreateNetwork(taskId, network);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "accepted", true,
                "taskId", taskId,
                "message", "Create operation started for network \"" + network.getName() + "\"",
                "data", Map.of(
                        "networkId", networkId,
                        "networkName", network.getName()
                )
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateNetwork(@PathVariable String id, @RequestBody Network network) {
        // Validate the network exists before starting async task
        var existing = networkService.getNetworkById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String taskId = taskService.createTask(
                "UPDATE_NETWORK",
                "Updating network \"" + network.getName() + "\"",
                id,
                network.getName()
        );

        // Fire async execution
        taskService.executeUpdateNetwork(taskId, id, network);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "accepted", true,
                "taskId", taskId,
                "message", "Update operation started for network \"" + network.getName() + "\"",
                "data", Map.of(
                        "networkId", id,
                        "networkName", network.getName()
                )
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteNetwork(@PathVariable String id) {
        // Validate the network exists before starting async task
        var existing = networkService.getNetworkById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String networkName = existing.get().getName();

        String taskId = taskService.createTask(
                "DELETE_NETWORK",
                "Deleting network \"" + networkName + "\"",
                id,
                networkName
        );

        // Fire async execution
        taskService.executeDeleteNetwork(taskId, id);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "accepted", true,
                "taskId", taskId,
                "message", "Delete operation started for network \"" + networkName + "\"",
                "data", Map.of(
                        "networkId", id,
                        "networkName", networkName
                )
        ));
    }
}
