import { ReportService } from '../services/ReportService.js';

export class ReportController {
  static getSummary(req, res) {
    try {
      const summary = ReportService.getReportsAndAggregates();
      res.json(summary);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
}
