package com.anonconnect.service;

import com.anonconnect.dto.AuthResponse;
import com.anonconnect.dto.LoginRequest;
import com.anonconnect.dto.RegisterRequest;
import com.anonconnect.entity.User;
import com.anonconnect.entity.UserPreference;
import com.anonconnect.exception.AppException;
import com.anonconnect.repository.UserPreferenceRepository;
import com.anonconnect.repository.UserRepository;
import com.anonconnect.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(HttpStatus.CONFLICT, "Username already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .country(request.getCountry())
                .gender(request.getGender())
                .role("USER")
                .build();
        user = userRepository.save(user);

        UserPreference pref = UserPreference.builder().userId(user.getId()).build();
        preferenceRepository.save(pref);

        String token = jwtTokenProvider.generateToken(
                user.getId(), user.getUsername(), user.getRole());

        log.info("User registered: {}", user.getUsername());

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole())
                .userId(user.getId())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        if (Boolean.TRUE.equals(user.getIsBanned())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Account is banned: " + user.getBanReason());
        }

        String token = jwtTokenProvider.generateToken(
                user.getId(), user.getUsername(), user.getRole());

        log.info("User logged in: {}", user.getUsername());

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole())
                .userId(user.getId())
                .build();
    }

    public AuthResponse createAnonymousSession(String displayName) {
        String anonUsername = (displayName != null && !displayName.isBlank())
                ? displayName.trim()
                : "anon_" + System.currentTimeMillis();
        String anonPassword = java.util.UUID.randomUUID().toString();

        // If username taken, append random suffix
        if (userRepository.existsByUsername(anonUsername)) {
            anonUsername = anonUsername + "_" + (System.currentTimeMillis() % 10000);
        }

        RegisterRequest request = new RegisterRequest();
        request.setUsername(anonUsername);
        request.setPassword(anonPassword);

        return register(request);
    }
}
