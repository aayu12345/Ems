package com.example.employeemanager.service;

import com.example.employeemanager.config.JwtTokenProvider;
import com.example.employeemanager.dto.AuthResponse;
import com.example.employeemanager.dto.LoginRequest;
import com.example.employeemanager.dto.RegisterRequest;
import com.example.employeemanager.model.Role;
import com.example.employeemanager.model.User;
import com.example.employeemanager.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public AuthResponse registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new IllegalArgumentException("Email is already in use by another workspace user");
        }

        Role userRole = Role.valueOf(registerRequest.getRole().toUpperCase());
        String employeeId = registerRequest.getEmployeeId();

        User user = new User(
                registerRequest.getEmail(),
                passwordEncoder.encode(registerRequest.getPassword()),
                registerRequest.getName(),
                userRole,
                employeeId
        );

        userRepository.save(user);

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name());
        AuthResponse.UserSummary summary = new AuthResponse.UserSummary(
                user.getEmail(), user.getName(), user.getRole().name(), user.getEmployeeId()
        );

        return new AuthResponse(token, summary);
    }

    public AuthResponse authenticateUser(LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email credentials or incorrect password."));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email credentials or incorrect password.");
        }

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name());
        AuthResponse.UserSummary summary = new AuthResponse.UserSummary(
                user.getEmail(), user.getName(), user.getRole().name(), user.getEmployeeId()
        );

        return new AuthResponse(token, summary);
    }

    public AuthResponse.UserSummary getCurrentUserSummary() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            throw new IllegalStateException("Unauthorized session");
        }

        String email = (String) auth.getPrincipal();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        return new AuthResponse.UserSummary(
                user.getEmail(), user.getName(), user.getRole().name(), user.getEmployeeId()
        );
    }
}
