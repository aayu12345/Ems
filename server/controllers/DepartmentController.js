import { DepartmentService } from '../services/DepartmentService.js';

export class DepartmentController {
  static getDepartments(req, res) {
    try {
      const list = DepartmentService.getAllDepartments();
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  static create(req, res) {
    try {
      const data = req.body;
      const dept = DepartmentService.createDepartment(data);
      res.status(201).json(dept);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  static update(req, res) {
    try {
      const deptId = req.params.id;
      const data = req.body;
      const dept = DepartmentService.updateDepartment(deptId, data);
      res.json(dept);
    } catch (e) {
      const statusCode = e.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ error: e.message });
    }
  }

  static delete(req, res) {
    try {
      const deptId = req.params.id;
      const result = DepartmentService.deleteDepartment(deptId);
      res.json(result);
    } catch (e) {
      const statusCode = e.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ error: e.message });
    }
  }
}
