package com.anonconnect.controller;

import com.anonconnect.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    @Value("${HOSTNAME:local-dev}")
    private String instanceId;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        return ResponseEntity.ok()
                .header("X-Instance-Id", instanceId)
                .body(ApiResponse.ok(Map.of(
                        "status", "UP",
                        "service", "AnonConnect Backend",
                        "timestamp", Instant.now().toString(),
                        "version", "1.0.0",
                        "instanceId", instanceId
                )));
    }
}
