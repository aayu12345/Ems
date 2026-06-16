import bcrypt from 'bcryptjs';
import { JSONDatabase } from '../db.js';

export class EmployeeService {
  static getAllEmployees() {
    const db = JSONDatabase.load();
    return db.employees;
  }

  static createEmployee(data) {
    const db = JSONDatabase.load();

    if (!data.name || !data.email || !data.departmentId) {
      throw new Error('Name, email, and department are required');
    }

    const emailUsed = db.employees.some(e => e.email.toLowerCase() === data.email.toLowerCase());
    if (emailUsed) {
      throw new Error('Employee email already exists');
    }

    const newId = `emp-${Date.now()}`;
    const newEmployee = {
      id: newId,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || '',
      role: data.role || 'Staff Member',
      departmentId: data.departmentId,
      salary: Number(data.salary) || 45000,
      status: data.status || 'Active',
      joinDate: data.joinDate || new Date().toISOString().split('T')[0],
      address: data.address || '',
      performanceScore: Number(data.performanceScore) || 4
    };

    db.employees.push(newEmployee);

    // Optionally auto-create user account
    if (data.createAccount) {
      const passwordHash = bcrypt.hashSync(data.initialPassword || 'employee123', 10);
      const newUser = {
        id: `usr-${Date.now()}`,
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        role: 'Employee',
        employeeId: newId
      };
      db.users.push(newUser);
    }

    JSONDatabase.save(db);
    return newEmployee;
  }

  static updateEmployee(empId, data, user) {
    const db = JSONDatabase.load();
    const index = db.employees.findIndex(e => e.id === empId);

    if (index === -1) {
      throw new Error('Employee profile not found');
    }

    const isAdmin = user.role === 'Admin';
    const isSelf = user.employeeId === empId;

    if (!isAdmin && !isSelf) {
      throw new Error('Unauthorized to modify this employee profile');
    }

    const current = db.employees[index];

    if (isAdmin) {
      db.employees[index] = {
        ...current,
        name: data.name ?? current.name,
        email: data.email ? data.email.toLowerCase() : current.email,
        phone: data.phone ?? current.phone,
        role: data.role ?? current.role,
        departmentId: data.departmentId ?? current.departmentId,
        salary: data.salary !== undefined ? Number(data.salary) : current.salary,
        status: data.status ?? current.status,
        joinDate: data.joinDate ?? current.joinDate,
        address: data.address ?? current.address,
        performanceScore: data.performanceScore !== undefined ? Number(data.performanceScore) : current.performanceScore
      };

      // Update name in User DB if it changes
      const userIndex = db.users.findIndex(u => u.employeeId === empId);
      if (userIndex !== -1) {
        db.users[userIndex].name = data.name ?? db.users[userIndex].name;
        if (data.email) {
          db.users[userIndex].email = data.email.toLowerCase();
        }
      }
    } else {
      // Employees can only update phone, address, email
      db.employees[index] = {
        ...current,
        phone: data.phone ?? current.phone,
        address: data.address ?? current.address,
        email: data.email ? data.email.toLowerCase() : current.email
      };

      const userIndex = db.users.findIndex(u => u.employeeId === empId);
      if (userIndex !== -1 && data.email) {
        db.users[userIndex].email = data.email.toLowerCase();
      }
    }

    JSONDatabase.save(db);
    return db.employees[index];
  }

  static deleteEmployee(empId) {
    const db = JSONDatabase.load();
    const index = db.employees.findIndex(e => e.id === empId);
    if (index === -1) {
      throw new Error('Employee not found');
    }

    db.employees = db.employees.filter(e => e.id !== empId);
    db.users = db.users.filter(u => u.employeeId !== empId);
    db.attendance = db.attendance.filter(a => a.employeeId !== empId);
    db.payroll = db.payroll.filter(p => p.employeeId !== empId);

    // Safeguard check: If they were managing a department, unset them
    db.departments = db.departments.map(d => {
      if (d.managerId === empId) {
        return { ...d, managerId: undefined, managerName: 'Unassigned' };
      }
      return d;
    });

    JSONDatabase.save(db);
    return { success: true, message: 'Employee and all associated records deleted successfully.' };
  }
}
