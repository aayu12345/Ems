import { AttendanceService } from '../services/AttendanceService.js';

export class AttendanceController {
  static getLogs(req, res) {
    try {
      const logs = AttendanceService.getAttendanceLogs(req.user);
      res.json(logs);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  static mark(req, res) {
    try {
      const data = req.body;
      const log = AttendanceService.markAttendance(data, req.user);
      res.json({ success: true, log, message: 'Attendance registered successfully.' });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
}
