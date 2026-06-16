package com.example.employeemanager.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "attendance_records")
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dbId;

    @Column(nullable = false)
    private String id; // custom unique UUID or sequence string

    @Column(name = "employee_id", nullable = false)
    private String employeeId;

    @Column(name = "employee_name", nullable = false)
    private String employeeName;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String status; // "Present", "Absent", "On_Leave"

    @Column(name = "check_in")
    private String checkIn;

    @Column(name = "check_out")
    private String checkOut;

    @Column(name = "total_hours")
    private Double totalHours;

    public Attendance() {}

    public Attendance(String id, String employeeId, String employeeName, LocalDate date, String status, String checkIn, String checkOut, Double totalHours) {
        this.id = id;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.date = date;
        this.status = status;
        this.checkIn = checkIn;
        this.checkOut = checkOut;
        this.totalHours = totalHours;
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
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCheckIn() { return checkIn; }
    public void setCheckIn(String checkIn) { this.checkIn = checkIn; }
    public String getCheckOut() { return checkOut; }
    public void setCheckOut(String checkOut) { this.checkOut = checkOut; }
    public Double getTotalHours() { return totalHours; }
    public void setTotalHours(Double totalHours) { this.totalHours = totalHours; }
}
