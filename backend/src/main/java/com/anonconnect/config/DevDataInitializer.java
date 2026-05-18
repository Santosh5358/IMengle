package com.anonconnect.config;

import com.anonconnect.entity.User;
import com.anonconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DevDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .email("admin@anonconnect.local")
                    .role("ADMIN")
                    .build();
            userRepository.save(admin);
            log.info("Dev admin user created — username: admin, password: admin123");
        }

        User santosh = ensureDevUser("santosh", "santosh123");
        User ashish = ensureDevUser("Ashish", "ashish123");

        if (santosh != null && ashish != null) {
            enableMutualDirectCall(santosh, ashish);
        }
    }

    private User ensureDevUser(String username, String password) {
        if (userRepository.existsByUsername(username)) {
            return userRepository.findByUsername(username).orElse(null);
        }

        User user = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(password))
                .email(username.toLowerCase() + "@anonconnect.local")
                .role("USER")
                .build();

        user = userRepository.save(user);
        log.info("Dev user created — username: {}, password: {}", username, password);
        return user;
    }

    private void enableMutualDirectCall(User first, User second) {
        if (first == null || second == null) {
            return;
        }

        List<String> firstAllowed = first.getDirectCallAllowedUserIds() == null
                ? new ArrayList<>() : new ArrayList<>(first.getDirectCallAllowedUserIds());
        List<String> secondAllowed = second.getDirectCallAllowedUserIds() == null
                ? new ArrayList<>() : new ArrayList<>(second.getDirectCallAllowedUserIds());

        if (!firstAllowed.contains(second.getId())) {
            firstAllowed.add(second.getId());
        }
        if (!secondAllowed.contains(first.getId())) {
            secondAllowed.add(first.getId());
        }

        first.setDirectCallEnabled(true);
        second.setDirectCallEnabled(true);
        first.setDirectCallAllowedUserIds(firstAllowed);
        second.setDirectCallAllowedUserIds(secondAllowed);

        userRepository.save(first);
        userRepository.save(second);
        log.info("Direct call enabled between {} and {}", first.getUsername(), second.getUsername());
    }
}
