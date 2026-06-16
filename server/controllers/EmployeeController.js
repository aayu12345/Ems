import { EmployeeService } from '../services/EmployeeService.js';

export class EmployeeController {
  static getEmployees(req, res) {
    try {
      const list = EmployeeService.getAllEmployees();
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  static create(req, res) {
    try {
      const data = req.body;
      const employee = EmployeeService.createEmployee(data);
      res.status(201).json(employee);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  static update(req, res) {
    try {
      const empId = req.params.id;
      const data = req.body;
      const employee = EmployeeService.updateEmployee(empId, data, req.user);
      res.json(employee);
    } catch (e) {
      const statusCode = e.message.includes('Unauthorized') ? 403 : (e.message.includes('not found') ? 404 : 400);
      res.status(statusCode).json({ error: e.message });
    }
  }

  static delete(req, res) {
    try {
      const empId = req.params.id;
      const result = EmployeeService.deleteEmployee(empId);
      res.json(result);
    } catch (e) {
      const statusCode = e.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ error: e.message });
    }
  }
}
