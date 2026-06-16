import { PayrollService } from '../services/PayrollService.js';

export class PayrollController {
  static getLogs(req, res) {
    try {
      const logs = PayrollService.getPayrollLogs(req.user);
      res.json(logs);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  static generate(req, res) {
    try {
      const { month, year } = req.body;
      const result = PayrollService.generatePayroll({ month, year });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  static update(req, res) {
    try {
      const payId = req.params.id;
      const { bonuses, deductions, status } = req.body;
      const ledger = PayrollService.updatePayrollRecord(payId, { bonuses, deductions, status });
      res.json(ledger);
    } catch (e) {
      const statusCode = e.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ error: e.message });
    }
  }
}
