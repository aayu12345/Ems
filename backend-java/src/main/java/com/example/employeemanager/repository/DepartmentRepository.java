package com.example.employeemanager.repository;

import com.example.employeemanager.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findById(String id);
    boolean existsById(String id);
}
