import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_FILE_PATH = path.join(process.cwd(), 'db.json');

export class JSONDatabase {
  static cache = null;

  static load() {
    if (this.cache) {
      return this.cache;
    }

    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.cache = JSON.parse(raw);
        return this.cache;
      } catch (e) {
        console.error('Error loading DB file, re-initializing storage...', e);
      }
    }

    // Initialize with seeded data
    const db = this.getSeedData();
    this.saveToDisk(db);
    this.cache = db;
    return db;
  }

  static save(db) {
    this.cache = db;
    this.saveToDisk(db);
  }

  static saveToDisk(db) {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database to disk:', e);
    }
  }

  static getSeedData() {
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    const employeePasswordHash = bcrypt.hashSync('employee123', 10);
    const hash3 = bcrypt.hashSync('pass123', 10);

    const departments = [
      {
        id: 'dept-1',
        name: 'Engineering',
        managerId: 'emp-2',
        managerName: 'Sarah Connor',
        budget: 650000,
        location: 'Floor 3, Tech Tower',
        description: 'Software development, infrastructure, and technical design.'
      },
      {
        id: 'dept-2',
        name: 'Human Resources',
        managerId: 'emp-4',
        managerName: 'Michael Scott',
        budget: 150000,
        location: 'Floor 1, Suite A',
        description: 'Recruitment, onboarding, employee experience, and benefits.'
      },
      {
        id: 'dept-3',
        name: 'Marketing',
        managerId: 'emp-5',
        managerName: 'Pam Beesly',
        budget: 220000,
        location: 'Floor 2, Creative Hub',
        description: 'Branding, campaign strategy, product marketing, and SEO.'
      },
      {
        id: 'dept-4',
        name: 'Sales',
        managerId: 'emp-6',
        managerName: 'Jim Halpert',
        budget: 350000,
        location: 'Floor 2, Sales Floor',
        description: 'Enterprise outreach, customer success, and revenue generation.'
      }
    ];

    const employees = [
      {
        id: 'emp-1',
        name: 'System Admin',
        email: 'admin@company.com',
        phone: '+1 (555) 019-2831',
        role: 'IT Director & Administrator',
        departmentId: 'dept-1',
        salary: 115000,
        status: 'Active',
        joinDate: '2024-01-15',
        address: '123 Admin Lane, Cyber City',
        performanceScore: 5
      },
      {
        id: 'emp-2',
        name: 'Sarah Connor',
        email: 'sconnor@company.com',
        phone: '+1 (555) 543-2198',
        role: 'VP Engineering',
        departmentId: 'dept-1',
        salary: 145000,
        status: 'Active',
        joinDate: '2023-05-10',
        address: '742 Cyberdyne Blvd, Los Angeles',
        performanceScore: 5
      },
      {
        id: 'emp-3',
        name: 'John Doe',
        email: 'employee@company.com',
        phone: '+1 (555) 123-4567',
        role: 'Software Engineer II',
        departmentId: 'dept-1',
        salary: 85000,
        status: 'Active',
        joinDate: '2025-02-18',
        address: '456 Elmwood St, Metroville',
        performanceScore: 4
      },
      {
        id: 'emp-4',
        name: 'Michael Scott',
        email: 'mscott@company.com',
        phone: '+1 (555) 890-4321',
        role: 'HR Manager',
        departmentId: 'dept-2',
        salary: 75000,
        status: 'Active',
        joinDate: '2022-11-01',
        address: '1725 Slough Avenue, Scranton',
        performanceScore: 3
      },
      {
        id: 'emp-5',
        name: 'Pam Beesly',
        email: 'pam@company.com',
        phone: '+1 (555) 902-1834',
        role: 'Creative Designer',
        departmentId: 'dept-3',
        salary: 62000,
        status: 'On Leave',
        joinDate: '2024-03-24',
        address: '89 Main Street, Scranton',
        performanceScore: 4
      },
      {
        id: 'emp-6',
        name: 'Jim Halpert',
        email: 'jhalpert@company.com',
        phone: '+1 (555) 301-4455',
        role: 'Account Executive',
        departmentId: 'dept-4',
        salary: 82000,
        status: 'Active',
        joinDate: '2023-08-12',
        address: '402 Oak Blvd, Scranton',
        performanceScore: 4
      }
    ];

    const users = [
      {
        id: 'usr-1',
        email: 'admin@company.com',
        passwordHash: adminPasswordHash,
        name: 'System Admin',
        role: 'Admin',
        employeeId: 'emp-1'
      },
      {
        id: 'usr-2',
        email: 'employee@company.com',
        passwordHash: employeePasswordHash,
        name: 'John Doe',
        role: 'Employee',
        employeeId: 'emp-3'
      },
      {
        id: 'usr-4',
        email: 'mscott@company.com',
        passwordHash: hash3,
        name: 'Michael Scott',
        role: 'Admin',
        employeeId: 'emp-4'
      }
    ];

    const attendance = [
      { id: 'att-1', employeeId: 'emp-1', employeeName: 'System Admin', date: '2026-06-15', status: 'Present', clockIn: '08:45', clockOut: '17:30' },
      { id: 'att-2', employeeId: 'emp-2', employeeName: 'Sarah Connor', date: '2026-06-15', status: 'Present', clockIn: '09:00', clockOut: '18:15' },
      { id: 'att-3', employeeId: 'emp-3', employeeName: 'John Doe', date: '2026-06-15', status: 'Present', clockIn: '09:12', clockOut: '17:45' },
      { id: 'att-4', employeeId: 'emp-4', employeeName: 'Michael Scott', date: '2026-06-15', status: 'Late', clockIn: '10:15', clockOut: '16:00' },
      { id: 'att-5', employeeId: 'emp-5', employeeName: 'Pam Beesly', date: '2026-06-15', status: 'Leave', leaveReason: 'Maternity Leave' },
      { id: 'att-6', employeeId: 'emp-6', employeeName: 'Jim Halpert', date: '2026-06-15', status: 'Present', clockIn: '08:55', clockOut: '17:05' },

      { id: 'att-7', employeeId: 'emp-1', employeeName: 'System Admin', date: '2026-06-16', status: 'Present', clockIn: '08:30', clockOut: '17:00' },
      { id: 'att-8', employeeId: 'emp-2', employeeName: 'Sarah Connor', date: '2026-06-16', status: 'Present', clockIn: '08:50', clockOut: '18:00' },
      { id: 'att-9', employeeId: 'emp-3', employeeName: 'John Doe', date: '2026-06-16', status: 'Present', clockIn: '09:05', clockOut: '17:30' },
      { id: 'att-10', employeeId: 'emp-4', employeeName: 'Michael Scott', date: '2026-06-16', status: 'Late', clockIn: '09:45', clockOut: '16:30' },
      { id: 'att-11', employeeId: 'emp-5', employeeName: 'Pam Beesly', date: '2026-06-16', status: 'Leave', leaveReason: 'Maternity Leave' },
      { id: 'att-12', employeeId: 'emp-6', employeeName: 'Jim Halpert', date: '2026-06-16', status: 'Absent' }
    ];

    const payroll = [
      { id: 'pay-1', employeeId: 'emp-1', employeeName: 'System Admin', month: 'May', year: 2026, baseSalary: 9583.33, bonuses: 500, deductions: 250, netSalary: 9833.33, status: 'Paid', payoutDate: '2026-05-30' },
      { id: 'pay-2', employeeId: 'emp-2', employeeName: 'Sarah Connor', month: 'May', year: 2026, baseSalary: 12083.33, bonuses: 1200, deductions: 400, netSalary: 12883.33, status: 'Paid', payoutDate: '2026-05-30' },
      { id: 'pay-3', employeeId: 'emp-3', employeeName: 'John Doe', month: 'May', year: 2026, baseSalary: 7083.33, bonuses: 0, deductions: 180, netSalary: 6903.33, status: 'Paid', payoutDate: '2026-05-30' },
      { id: 'pay-4', employeeId: 'emp-4', employeeName: 'Michael Scott', month: 'May', year: 2026, baseSalary: 6250.00, bonuses: 200, deductions: 150, netSalary: 6300.00, status: 'Paid', payoutDate: '2026-05-30' },
      { id: 'pay-5', employeeId: 'emp-5', employeeName: 'Pam Beesly', month: 'May', year: 2026, baseSalary: 5166.67, bonuses: 0, deductions: 5166.67, netSalary: 0, status: 'Paid', payoutDate: '2026-05-30' },
      { id: 'pay-6', employeeId: 'emp-6', employeeName: 'Jim Halpert', month: 'May', year: 2026, baseSalary: 6833.33, bonuses: 800, deductions: 200, netSalary: 7433.33, status: 'Paid', payoutDate: '2026-05-30' },

      { id: 'pay-7', employeeId: 'emp-1', employeeName: 'System Admin', month: 'June', year: 2026, baseSalary: 9583.33, bonuses: 600, deductions: 250, netSalary: 9933.33, status: 'Pending' },
      { id: 'pay-8', employeeId: 'emp-2', employeeName: 'Sarah Connor', month: 'June', year: 2026, baseSalary: 12083.33, bonuses: 1000, deductions: 400, netSalary: 12683.33, status: 'Pending' },
      { id: 'pay-9', employeeId: 'emp-3', employeeName: 'John Doe', month: 'June', year: 2026, baseSalary: 7083.33, bonuses: 150, deductions: 180, netSalary: 7053.33, status: 'Pending' }
    ];

    return {
      users,
      employees,
      departments,
      attendance,
      payroll
    };
  }
}
