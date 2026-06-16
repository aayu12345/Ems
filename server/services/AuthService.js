import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JSONDatabase } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supreme-employee-workspace-secret-key-2026';

export class AuthService {
  static signup({ name, email, password, role }) {
    if (!name || !email || !password) {
      throw new Error('Missing name, email, or password');
    }

    const db = JSONDatabase.load();
    const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check if there is an existing Employee with this email
    let linkedEmployee = db.employees.find(e => e.email.toLowerCase() === email.toLowerCase());
    const employeeId = linkedEmployee ? linkedEmployee.id : `emp-${Date.now()}`;
    
    if (!linkedEmployee) {
      // Create matching Employee Profile automatically
      const newEmployee = {
        id: employeeId,
        name,
        email: email.toLowerCase(),
        phone: '',
        role: role === 'Admin' ? 'Administrator' : 'Employee Associate',
        departmentId: db.departments[0] ? db.departments[0].id : 'dept-1',
        salary: 50000,
        status: 'Active',
        joinDate: new Date().toISOString().split('T')[0],
        address: '',
        performanceScore: 4
      };
      db.employees.push(newEmployee);
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = {
      id: `usr-${Date.now()}`,
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: role === 'Admin' ? 'Admin' : 'Employee',
      employeeId
    };

    db.users.push(newUser);
    JSONDatabase.save(db);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, employeeId: newUser.employeeId, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        employeeId: newUser.employeeId
      }
    };
  }

  static login({ email, password }) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const db = JSONDatabase.load();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, employeeId: user.employeeId, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId
      }
    };
  }

  static getProfile(userId) {
    const db = JSONDatabase.load();
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      throw new Error('User session invalid');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId
      }
    };
  }
}
