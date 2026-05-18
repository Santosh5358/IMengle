package com.anonconnect.dto;

import lombok.Data;

import java.util.List;

@Data
public class DirectCallAccessRequest {
    private String username;
    private Boolean enabled;
    private List<String> allowedUsernames;
}
