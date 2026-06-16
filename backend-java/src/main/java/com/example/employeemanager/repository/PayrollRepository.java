package com.example.employeemanager.repository;

import com.example.employeemanager.model.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    List<Payroll> findByEmployeeId(String employeeId);
    List<Payroll> findByMonthAndYear(String month, int year);
    Optional<Payroll> findByEmployeeIdAndMonthAndYear(String employeeId, String month, int year);
    Optional<Payroll> findById(String id);
}
