package com.anonconnect.repository;

import com.anonconnect.entity.ActiveConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ActiveConnectionRepository extends JpaRepository<ActiveConnection, UUID> {
    Optional<ActiveConnection> findByUserId(UUID userId);
    Optional<ActiveConnection> findBySocketId(String socketId);
    @Modifying @Transactional
    void deleteByUserId(UUID userId);
    @Modifying @Transactional
    void deleteBySocketId(String socketId);
    long count();
}
