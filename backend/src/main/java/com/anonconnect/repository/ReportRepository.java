package com.anonconnect.repository;

import com.anonconnect.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends MongoRepository<Report, String> {
    Page<Report> findByStatus(String status, Pageable pageable);
    Page<Report> findByReportedId(String reportedId, Pageable pageable);
    long countByStatus(String status);
}
