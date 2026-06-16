package com.example.employeemanager.service;

import com.example.employeemanager.model.Employee;
import com.example.employeemanager.model.Payroll;
import com.example.employeemanager.repository.EmployeeRepository;
import com.example.employeemanager.repository.PayrollRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;

    public PayrollService(PayrollRepository payrollRepository,
                          EmployeeRepository employeeRepository) {
        this.payrollRepository = payrollRepository;
        this.employeeRepository = employeeRepository;
    }

    public List<Payroll> getAllPayroll() {
        return payrollRepository.findAll();
    }

    public void generatePayroll(String month, int year) {
        List<Employee> employees = employeeRepository.findAll();

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
            }
        }
    }

    public Payroll updatePayroll(String id, Map<String, Object> body) {
        Payroll slip = payrollRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payslip reference code not found"));

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

        return payrollRepository.save(slip);
    }
}
