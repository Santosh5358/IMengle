package com.anonconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class DirectCallConfigResponse {
    private Boolean enabled;
    private List<String> allowedUsernames;
}
