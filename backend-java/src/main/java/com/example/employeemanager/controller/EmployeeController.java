package com.example.employeemanager.controller;

import com.example.employeemanager.model.Employee;
import com.example.employeemanager.model.Role;
import com.example.employeemanager.model.User;
import com.example.employeemanager.repository.EmployeeRepository;
import com.example.employeemanager.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeController(EmployeeRepository employeeRepository,
                              UserRepository userRepository,
                              PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(employeeRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addEmployee(@RequestBody Employee employee) {
        if (employeeRepository.existsById(employee.getId())) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "An associate with unique ID " + employee.getId() + " already exists."));
        }

        if (employeeRepository.findByEmail(employee.getEmail()).isPresent()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email " + employee.getEmail() + " is already registered."));
        }

        if (employee.getHireDate() == null) {
            employee.setHireDate(LocalDate.now());
        }

        Employee saved = employeeRepository.save(employee);

        // Auto-provision credentials for the newly created employee
        String defaultPassword = "Welcome@" + employee.getId();
        Role userRole = employee.getRole().equalsIgnoreCase("Admin") ? Role.ADMIN : Role.EMPLOYEE;

        User user = new User(
                employee.getEmail(),
                passwordEncoder.encode(defaultPassword),
                employee.getName(),
                userRole,
                employee.getId()
        );
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateEmployee(@PathVariable String id, @RequestBody Employee updatedDetails) {
        Employee employee = employeeRepository.findById(id)
                .orElse(null);

        if (employee == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Employee not found"));
        }

        // Apply changes
        employee.setName(updatedDetails.getName());
        employee.setDepartment(updatedDetails.getDepartment());
        employee.setPosition(updatedDetails.getPosition());
        employee.setSalary(updatedDetails.getSalary());
        employee.setStatus(updatedDetails.getStatus());

        Employee saved = employeeRepository.save(employee);

        // Update corresponding User record if present
        userRepository.findByEmail(employee.getEmail()).ifPresent(user -> {
            user.setName(updatedDetails.getName());
            user.setRole(updatedDetails.getRole().equalsIgnoreCase("Admin") ? Role.ADMIN : Role.EMPLOYEE);
            userRepository.save(user);
        });

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteEmployee(@PathVariable String id) {
        Employee employee = employeeRepository.findById(id)
                .orElse(null);

        if (employee == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Employee not found"));
        }

        employeeRepository.delete(employee);

        // Revoke associated credential login
        userRepository.findByEmail(employee.getEmail()).ifPresent(userRepository::delete);

        return ResponseEntity.ok(Map.of("success", true, "message", "Employee database records and login credentials purged successfully"));
    }
}
