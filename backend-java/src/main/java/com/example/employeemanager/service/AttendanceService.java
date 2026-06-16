package com.example.employeemanager.service;

import com.example.employeemanager.model.Attendance;
import com.example.employeemanager.repository.AttendanceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;

    public AttendanceService(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    public Attendance checkIn(String employeeId, String employeeName) {
        if (employeeId == null || employeeName == null) {
            throw new IllegalArgumentException("Employee connection parameters missing");
        }

        LocalDate today = LocalDate.now();
        if (attendanceRepository.findByEmployeeIdAndDate(employeeId, today).isPresent()) {
            throw new IllegalArgumentException("You have already logged dynamic check-in presence for today.");
        }

        String checkInTime = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));

        Attendance log = new Attendance(
                UUID.randomUUID().toString(),
                employeeId,
                employeeName,
                today,
                "Present",
                checkInTime,
                null,
                null
        );

        return attendanceRepository.save(log);
    }

    public Attendance checkOut(String employeeId) {
        if (employeeId == null) {
            throw new IllegalArgumentException("employeeId is required");
        }

        LocalDate today = LocalDate.now();
        Attendance log = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElseThrow(() -> new IllegalArgumentException("Active shift check-in not verified for today."));

        if (log.getCheckOut() != null) {
            throw new IllegalArgumentException("Shift checkout stamp already verified for today.");
        }

        String checkOutTime = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        log.setCheckOut(checkOutTime);

        // Calculate hours worked
        try {
            LocalTime in = LocalTime.parse(log.getCheckIn(), DateTimeFormatter.ofPattern("HH:mm"));
            LocalTime out = LocalTime.parse(checkOutTime, DateTimeFormatter.ofPattern("HH:mm"));
            long minutes = ChronoUnit.MINUTES.between(in, out);
            double hours = Math.round((minutes / 60.0) * 10.0) / 10.0;
            log.setTotalHours(hours > 0 ? hours : 8.0); // fallback default to 8.0 if negative or negligible
        } catch (Exception e) {
            log.setTotalHours(8.0);
        }

        return attendanceRepository.save(log);
    }
}
