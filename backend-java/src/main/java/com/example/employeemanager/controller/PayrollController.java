package com.example.employeemanager.controller;

import com.example.employeemanager.model.Employee;
import com.example.employeemanager.model.Payroll;
import com.example.employeemanager.repository.EmployeeRepository;
import com.example.employeemanager.repository.PayrollRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;

    public PayrollController(PayrollRepository payrollRepository,
                             EmployeeRepository employeeRepository) {
        this.payrollRepository = payrollRepository;
        this.employeeRepository = employeeRepository;
    }

    @GetMapping
    public ResponseEntity<List<Payroll>> getAllPayroll() {
        return ResponseEntity.ok(payrollRepository.findAll());
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> generatePayroll(@RequestBody Map<String, Object> request) {
        String month = (String) request.get("month");
        Object yearObj = request.get("year");

        if (month == null || yearObj == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Generating parameters (month and year) are missing"));
        }

        int year = Integer.parseInt(yearObj.toString());
        List<Employee> employees = employeeRepository.findAll();
        int createdCount = 0;

        for (Employee emp : employees) {
            if (!emp.getStatus().equalsIgnoreCase("Active")) {
                continue; // skip inactive staff profiles
            }

            // Check if record exists
            boolean exists = payrollRepository.findByEmployeeIdAndMonthAndYear(emp.getId(), month, year).isPresent();
            if (!exists) {
                double base = emp.getSalary();
                Payroll slip = new Payroll(
                        UUID.randomUUID().toString(),
                        emp.getId(),
                        emp.getName(),
                        base,
                        0.0,
                        0.0,
                        base,
                        month,
                        year,
                        "Pending",
                        null
                );
                payrollRepository.save(slip);
                createdCount++;
            }
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payroll logs successfully calculated. " + createdCount + " new entries added for " + month + " " + year
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePayroll(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Payroll slip = payrollRepository.findById(id)
                .orElse(null);

        if (slip == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Payslip reference code not found"));
        }

        if (body.containsKey("bonuses")) {
            slip.setBonuses(Double.parseDouble(body.get("bonuses").toString()));
        }
        if (body.containsKey("deductions")) {
            slip.setDeductions(Double.parseDouble(body.get("deductions").toString()));
        }
        if (body.containsKey("status")) {
            String status = (String) body.get("status");
            slip.setStatus(status);
            if (status.equalsIgnoreCase("Paid")) {
                slip.setPayoutDate(LocalDate.now().toString());
            }
        }

        // Recalculate net take home salary
        double net = slip.getBaseSalary() + slip.getBonuses() - slip.getDeductions();
        slip.setNetSalary(net > 0 ? net : 0.0);

        Payroll saved = payrollRepository.save(slip);
        return ResponseEntity.ok(saved);
    }
}
