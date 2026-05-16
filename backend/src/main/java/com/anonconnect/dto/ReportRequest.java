package com.anonconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReportRequest {
    @NotBlank
    private String reportedUserId;
    private String sessionId;
    @NotBlank @Size(max = 50)
    private String reason;
    @Size(max = 1000)
    private String description;
}
