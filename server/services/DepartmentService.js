import { JSONDatabase } from '../db.js';

export class DepartmentService {
  static getAllDepartments() {
    const db = JSONDatabase.load();
    return db.departments.map(dept => {
      const deptEmployees = db.employees.filter(e => e.departmentId === dept.id);
      const manager = db.employees.find(e => e.id === dept.managerId);
      return {
        ...dept,
        headcount: deptEmployees.length,
        totalSalary: deptEmployees.reduce((sum, e) => sum + e.salary, 0),
        managerName: manager ? manager.name : (dept.managerName || 'Unassigned')
      };
    });
  }

  static createDepartment({ name, managerId, budget, location, description }) {
    if (!name) {
      throw new Error('Department name is required');
    }

    const db = JSONDatabase.load();
    const manager = db.employees.find(e => e.id === managerId);

    const newDept = {
      id: `dept-${Date.now()}`,
      name,
      managerId: managerId || undefined,
      managerName: manager ? manager.name : 'Unassigned',
      budget: Number(budget) || 0,
      location: location || '',
      description: description || ''
    };

    db.departments.push(newDept);
    JSONDatabase.save(db);
    return newDept;
  }

  static updateDepartment(deptId, { name, managerId, budget, location, description }) {
    const db = JSONDatabase.load();
    const index = db.departments.findIndex(d => d.id === deptId);

    if (index === -1) {
      throw new Error('Department not found');
    }

    const manager = db.employees.find(e => e.id === managerId);

    db.departments[index] = {
      ...db.departments[index],
      name: name !== undefined ? name : db.departments[index].name,
      managerId: managerId !== undefined ? (managerId || undefined) : db.departments[index].managerId,
      managerName: managerId !== undefined ? (manager ? manager.name : 'Unassigned') : db.departments[index].managerName,
      budget: budget !== undefined ? Number(budget) : db.departments[index].budget,
      location: location !== undefined ? location : db.departments[index].location,
      description: description !== undefined ? description : db.departments[index].description
    };

    JSONDatabase.save(db);
    return db.departments[index];
  }

  static deleteDepartment(deptId) {
    const db = JSONDatabase.load();
    const index = db.departments.findIndex(d => d.id === deptId);

    if (index === -1) {
      throw new Error('Department not found');
    }

    db.departments = db.departments.filter(d => d.id !== deptId);
    const remainingDept = db.departments[0] ? db.departments[0].id : '';

    db.employees = db.employees.map(emp => {
      if (emp.departmentId === deptId) {
        return { ...emp, departmentId: remainingDept };
      }
      return emp;
    });

    JSONDatabase.save(db);
    return { success: true, message: 'Department deleted successfully. Linked employees were reassigned.' };
  }
}
