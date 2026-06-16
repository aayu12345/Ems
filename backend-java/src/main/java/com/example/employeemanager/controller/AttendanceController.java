package com.example.employeemanager.controller;

import com.example.employeemanager.model.Attendance;
import com.example.employeemanager.repository.AttendanceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;

    public AttendanceController(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    @GetMapping
    public ResponseEntity<List<Attendance>> getAllAttendance() {
        return ResponseEntity.ok(attendanceRepository.findAll());
    }

    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(@RequestBody Map<String, String> request) {
        String employeeId = request.get("employeeId");
        String employeeName = request.get("employeeName");

        if (employeeId == null || employeeName == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Employee connection parameters missing"));
        }

        LocalDate today = LocalDate.now();
        if (attendanceRepository.findByEmployeeIdAndDate(employeeId, today).isPresent()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "You have already logged dynamic check-in presence for today."));
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

        Attendance saved = attendanceRepository.save(log);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/check-out")
    public ResponseEntity<?> checkOut(@RequestBody Map<String, String> request) {
        String employeeId = request.get("employeeId");

        if (employeeId == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "employeeId is required"));
        }

        LocalDate today = LocalDate.now();
        Attendance log = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElse(null);

        if (log == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Active shift check-in not verified for today."));
        }

        if (log.getCheckOut() != null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Shift checkout stamp already verified for today."));
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

        Attendance saved = attendanceRepository.save(log);
        return ResponseEntity.ok(saved);
    }
}
