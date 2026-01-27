package com.example.telecom.repository;

import com.example.telecom.model.Network;
import com.example.telecom.model.NetworkStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NetworkRepository extends JpaRepository<Network, String> {

    List<Network> findByStatus(NetworkStatus status);
}
