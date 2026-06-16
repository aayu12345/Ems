package com.example.employeemanager.repository;

import com.example.employeemanager.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findById(String id);
    Optional<Employee> findByEmail(String email);
    List<Employee> findByDepartment(String departmentId);
    boolean existsById(String id);
}
