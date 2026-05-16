package com.anonconnect.repository;

import com.anonconnect.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {
    Page<Report> findByStatus(String status, Pageable pageable);
    Page<Report> findByReportedId(UUID reportedId, Pageable pageable);
    long countByStatus(String status);
}
