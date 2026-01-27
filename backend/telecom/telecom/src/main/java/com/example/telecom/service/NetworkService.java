package com.example.telecom.service;

import com.example.telecom.model.Network;
import com.example.telecom.model.NetworkStatus;
import com.example.telecom.repository.NetworkRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class NetworkService {

    private final NetworkRepository networkRepository;

    public NetworkService(NetworkRepository networkRepository) {
        this.networkRepository = networkRepository;
    }

    public List<Network> getAllNetworks() {
        return networkRepository.findAll();
    }

    public Optional<Network> getNetworkById(String id) {
        return networkRepository.findById(id);
    }

    public List<Network> getNetworksByStatus(NetworkStatus status) {
        return networkRepository.findByStatus(status);
    }

    public Network createNetwork(Network network) {
        if (network.getId() == null || network.getId().isBlank()) {
            network.setId("net-" + UUID.randomUUID().toString().substring(0, 8));
        }
        network.setCreatedAt(LocalDateTime.now());
        network.setUpdatedAt(LocalDateTime.now());
        return networkRepository.save(network);
    }

    public Optional<Network> updateNetwork(String id, Network networkDetails) {
        return networkRepository.findById(id).map(existing -> {
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
            return networkRepository.save(existing);
        });
    }

    public boolean deleteNetwork(String id) {
        if (networkRepository.existsById(id)) {
            networkRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
