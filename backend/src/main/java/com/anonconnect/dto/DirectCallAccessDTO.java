package com.anonconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class DirectCallAccessDTO {
    private String userId;
    private String username;
    private Boolean enabled;
    private List<String> allowedUsernames;
}
