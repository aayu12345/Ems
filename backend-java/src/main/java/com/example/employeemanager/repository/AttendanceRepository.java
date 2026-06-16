package com.example.employeemanager.repository;

import com.example.employeemanager.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByEmployeeId(String employeeId);
    List<Attendance> findByDate(LocalDate date);
    Optional<Attendance> findByEmployeeIdAndDate(String employeeId, LocalDate date);
    Optional<Attendance> findById(String id);
}
