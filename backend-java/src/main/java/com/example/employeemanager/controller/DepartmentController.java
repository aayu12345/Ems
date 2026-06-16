package com.example.employeemanager.controller;

import com.example.employeemanager.model.Department;
import com.example.employeemanager.repository.DepartmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    public DepartmentController(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createDepartment(@RequestBody Department department) {
        if (departmentRepository.existsById(department.getId())) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Department code " + department.getId() + " already exists."));
        }

        Department saved = departmentRepository.save(department);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateDepartment(@PathVariable String id, @RequestBody Department updatedDetails) {
        Department department = departmentRepository.findById(id)
                .orElse(null);

        if (department == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Department not found"));
        }

        department.setName(updatedDetails.getName());
        department.setManager(updatedDetails.getManager());
        department.setBudget(updatedDetails.getBudget());
        department.setLocation(updatedDetails.getLocation());
        department.setHeadcount(updatedDetails.getHeadcount());

        Department saved = departmentRepository.save(department);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteDepartment(@PathVariable String id) {
        Department department = departmentRepository.findById(id)
                .orElse(null);

        if (department == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Department not found"));
        }

        departmentRepository.delete(department);
        return ResponseEntity.ok(Map.of("success", true, "message", "Department record removed successfully"));
    }
}
