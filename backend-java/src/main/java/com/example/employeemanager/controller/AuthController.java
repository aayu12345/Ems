package com.example.employeemanager.controller;

import com.example.employeemanager.dto.AuthResponse;
import com.example.employeemanager.dto.LoginRequest;
import com.example.employeemanager.dto.RegisterRequest;
import com.example.employeemanager.model.Role;
import com.example.employeemanager.model.User;
import com.example.employeemanager.repository.UserRepository;
import com.example.employeemanager.config.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email is already in use by another workspace user"));
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

        return ResponseEntity.ok(new AuthResponse(token, summary));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email credentials or incorrect password."));
        }

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name());
        AuthResponse.UserSummary summary = new AuthResponse.UserSummary(
                user.getEmail(), user.getName(), user.getRole().name(), user.getEmployeeId()
        );

        return ResponseEntity.ok(new AuthResponse(token, summary));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized session"));
        }

        String email = (String) auth.getPrincipal();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        AuthResponse.UserSummary summary = new AuthResponse.UserSummary(
                user.getEmail(), user.getName(), user.getRole().name(), user.getEmployeeId()
        );

        return ResponseEntity.ok(Map.of("user", summary));
    }
}
