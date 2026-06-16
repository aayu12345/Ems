package com.example.employeemanager.model;

import jakarta.persistence.*;

@Entity
@Table(name = "payroll_statements")
public class Payroll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dbId;

    @Column(nullable = false)
    private String id; // Unique custom payroll statement code

    @Column(name = "employee_id", nullable = false)
    private String employeeId;

    @Column(name = "employee_name", nullable = false)
    private String employeeName;

    @Column(name = "base_salary", nullable = false)
    private double baseSalary;

    private double bonuses;
    private double deductions;

    @Column(name = "net_salary", nullable = false)
    private double netSalary;

    @Column(nullable = false)
    private String month;

    @Column(nullable = false)
    private int year;

    @Column(nullable = false)
    private String status; // "Paid", "Pending"

    @Column(name = "payout_date")
    private String payoutDate;

    public Payroll() {}

    public Payroll(String id, String employeeId, String employeeName, double baseSalary, double bonuses, double deductions, double netSalary, String month, int year, String status, String payoutDate) {
        this.id = id;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.baseSalary = baseSalary;
        this.bonuses = bonuses;
        this.deductions = deductions;
        this.netSalary = netSalary;
        this.month = month;
        this.year = year;
        this.status = status;
        this.payoutDate = payoutDate;
    }

    // Getters and Setters
    public Long getDbId() { return dbId; }
    public void setDbId(Long dbId) { this.dbId = dbId; }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public double getBaseSalary() { return baseSalary; }
    public void setBaseSalary(double baseSalary) { this.baseSalary = baseSalary; }
    public double getBonuses() { return bonuses; }
    public void setBonuses(double bonuses) { this.bonuses = bonuses; }
    public double getDeductions() { return deductions; }
    public void setDeductions(double deductions) { this.deductions = deductions; }
    public double getNetSalary() { return netSalary; }
    public void setNetSalary(double netSalary) { this.netSalary = netSalary; }
    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }
    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPayoutDate() { return payoutDate; }
    public void setPayoutDate(String payoutDate) { this.payoutDate = payoutDate; }
}
