package com.example.employeemanager.service;

import com.example.employeemanager.model.Employee;
import com.example.employeemanager.model.Role;
import com.example.employeemanager.model.User;
import com.example.employeemanager.repository.EmployeeRepository;
import com.example.employeemanager.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeService(EmployeeRepository employeeRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Optional<Employee> getEmployeeById(String id) {
        return employeeRepository.findById(id);
    }

    public Employee addEmployee(Employee employee) {
        if (employeeRepository.existsById(employee.getId())) {
            throw new IllegalArgumentException("An associate with unique ID " + employee.getId() + " already exists.");
        }

        if (employeeRepository.findByEmail(employee.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email " + employee.getEmail() + " is already registered.");
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

        return saved;
    }

    public Employee updateEmployee(String id, Employee updatedDetails) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

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

        return saved;
    }

    public void deleteEmployee(String id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        employeeRepository.delete(employee);

        // Revoke associated credential login
        userRepository.findByEmail(employee.getEmail()).ifPresent(userRepository::delete);
    }
}
