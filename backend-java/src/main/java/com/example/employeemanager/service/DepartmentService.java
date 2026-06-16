package com.example.employeemanager.service;

import com.example.employeemanager.model.Department;
import com.example.employeemanager.repository.DepartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Department createDepartment(Department department) {
        if (departmentRepository.existsById(department.getId())) {
            throw new IllegalArgumentException("Department code " + department.getId() + " already exists.");
        }
        return departmentRepository.save(department);
    }

    public Department updateDepartment(String id, Department updatedDetails) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));

        department.setName(updatedDetails.getName());
        department.setManager(updatedDetails.getManager());
        department.setBudget(updatedDetails.getBudget());
        department.setLocation(updatedDetails.getLocation());
        department.setHeadcount(updatedDetails.getHeadcount());

        return departmentRepository.save(department);
    }

    public void deleteDepartment(String id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));

        departmentRepository.delete(department);
    }
}
