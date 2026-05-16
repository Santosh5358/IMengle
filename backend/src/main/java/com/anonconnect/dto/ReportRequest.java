package com.anonconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class ReportRequest {
    @NotBlank
    private UUID reportedUserId;
    private UUID sessionId;
    @NotBlank @Size(max = 50)
    private String reason;
    @Size(max = 1000)
    private String description;
}
