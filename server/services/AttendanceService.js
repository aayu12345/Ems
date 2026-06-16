import { JSONDatabase } from '../db.js';

export class AttendanceService {
  static getAttendanceLogs(user) {
    const db = JSONDatabase.load();
    const isAdmin = user.role === 'Admin';
    
    if (isAdmin) {
      return db.attendance;
    } else {
      return db.attendance.filter(a => a.employeeId === user.employeeId);
    }
  }

  static markAttendance({ employeeId, date, status, clockIn, clockOut, leaveReason }, user) {
    const db = JSONDatabase.load();
    const isAdmin = user.role === 'Admin';
    const targetEmpId = isAdmin && employeeId ? employeeId : user.employeeId;

    if (!targetEmpId) {
      throw new Error('Employee ID is required.');
    }

    const emp = db.employees.find(e => e.id === targetEmpId);
    if (!emp) {
      throw new Error('Target employee record not found.');
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const logIdx = db.attendance.findIndex(a => a.employeeId === targetEmpId && a.date === targetDate);
    const statusMap = status || 'Present';

    let updatedOrCreatedLog;

    if (logIdx !== -1) {
      db.attendance[logIdx] = {
        ...db.attendance[logIdx],
        status: statusMap,
        clockIn: clockIn !== undefined ? clockIn : db.attendance[logIdx].clockIn,
        clockOut: clockOut !== undefined ? clockOut : db.attendance[logIdx].clockOut,
        leaveReason: leaveReason !== undefined ? leaveReason : db.attendance[logIdx].leaveReason
      };
      updatedOrCreatedLog = db.attendance[logIdx];
    } else {
      const newLog = {
        id: `att-${Date.now()}`,
        employeeId: targetEmpId,
        employeeName: emp.name,
        date: targetDate,
        status: statusMap,
        clockIn,
        clockOut,
        leaveReason
      };
      db.attendance.push(newLog);
      updatedOrCreatedLog = newLog;
    }

    JSONDatabase.save(db);
    return updatedOrCreatedLog;
  }
}
