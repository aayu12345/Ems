package com.example.employeemanager.controller;

import com.example.employeemanager.model.Attendance;
import com.example.employeemanager.service.AttendanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    public ResponseEntity<List<Attendance>> getAllAttendance() {
        return ResponseEntity.ok(attendanceService.getAllAttendance());
    }

    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(@RequestBody Map<String, String> request) {
        String employeeId = request.get("employeeId");
        String employeeName = request.get("employeeName");

        try {
            Attendance saved = attendanceService.checkIn(employeeId, employeeName);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/check-out")
    public ResponseEntity<?> checkOut(@RequestBody Map<String, String> request) {
        String employeeId = request.get("employeeId");

        try {
            Attendance saved = attendanceService.checkOut(employeeId);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            HttpStatus status = e.getMessage().contains("Active shift check-in") ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
            return ResponseEntity
                    .status(status)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
