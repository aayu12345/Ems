import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JSONDatabase, User, Employee, Department, Attendance, Payroll } from './server/db';

const JWT_SECRET = process.env.JWT_SECRET || 'supreme-employee-workspace-secret-key-2026';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON body parser
  app.use(express.json());

  // CORS headers for native compliance
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Authentication Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided, authorization denied' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: 'Failed to authenticate token' });
      }
      req.user = decoded;
      next();
    });
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }
    next();
  };

  // --- API ROUTES ---

  // Auth: Register/Signup
  app.post('/api/auth/signup', (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing name, email, or password' });
      }

      const db = JSONDatabase.load();
      const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Check if there is an existing Employee with this email
      let linkedEmployee = db.employees.find(e => e.email.toLowerCase() === email.toLowerCase());
      
      const employeeId = linkedEmployee?.id || `emp-${Date.now()}`;
      
      if (!linkedEmployee) {
        // Create matching Employee Profile automatically
        const newEmployee: Employee = {
          id: employeeId,
          name,
          email,
          phone: '',
          role: role === 'Admin' ? 'Administrator' : 'Employee Associate',
          departmentId: db.departments[0]?.id || 'dept-1', // Default to engineering or first dept
          salary: 50000,
          status: 'Active',
          joinDate: new Date().toISOString().split('T')[0],
          address: '',
          performanceScore: 4
        };
        db.employees.push(newEmployee);
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const newUser: User = {
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

      res.status(201).json({
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          employeeId: newUser.employeeId
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const db = JSONDatabase.load();
      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, employeeId: user.employeeId, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Auth: Fetch authenticated profile
  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    try {
      const db = JSONDatabase.load();
      const user = db.users.find(u => u.id === req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User session invalid' });
      }

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- EMPLOYEE ENDPOINTS ---

  // Get all employees (accessible to authenticated users)
  app.get('/api/employees', authenticateToken, (req: any, res) => {
    try {
      const db = JSONDatabase.load();
      let list = db.employees;

      // Regular Employee should only see everyone's public info, or we can return the list
      // but let's implement standard organization directory search
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create Employee (Admin only)
  app.post('/api/employees', authenticateToken, requireAdmin, (req, res) => {
    try {
      const db = JSONDatabase.load();
      const data = req.body;

      if (!data.name || !data.email || !data.departmentId) {
        return res.status(400).json({ error: 'Name, email, and department are required' });
      }

      // Check if email already used (can't have duplicate emails)
      const emailUsed = db.employees.some(e => e.email.toLowerCase() === data.email.toLowerCase());
      if (emailUsed) {
        return res.status(400).json({ error: 'Employee email already exists' });
      }

      const newId = `emp-${Date.now()}`;
      const newEmployee: Employee = {
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
        const newUser: User = {
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
      res.status(201).json(newEmployee);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update Employee (Admin can update all, Employee can update their own personal info: phone, address, email)
  app.put('/api/employees/:id', authenticateToken, (req: any, res) => {
    try {
      const db = JSONDatabase.load();
      const empId = req.params.id;
      const index = db.employees.findIndex(e => e.id === empId);

      if (index === -1) {
        return res.status(404).json({ error: 'Employee profile not found' });
      }

      const isAdmin = req.user.role === 'Admin';
      const isSelf = req.user.employeeId === empId;

      if (!isAdmin && !isSelf) {
        return res.status(403).json({ error: 'Unauthorized to modify this employee profile' });
      }

      const current = db.employees[index];
      const data = req.body;

      if (isAdmin) {
        // Admins can update all details
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

        // Also update name in User DB if it changes
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

        // Synchronize in user record
        const userIndex = db.users.findIndex(u => u.employeeId === empId);
        if (userIndex !== -1 && data.email) {
          db.users[userIndex].email = data.email.toLowerCase();
        }
      }

      JSONDatabase.save(db);
      res.json(db.employees[index]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete Employee (Admin only)
  app.delete('/api/employees/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
      const db = JSONDatabase.load();
      const empId = req.params.id;

      const userIndex = db.employees.findIndex(e => e.id === empId);
      if (userIndex === -1) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Delete employee
      db.employees = db.employees.filter(e => e.id !== empId);
      // Delete user account associated with employee
      db.users = db.users.filter(u => u.employeeId !== empId);
      // Delete attendance logs
      db.attendance = db.attendance.filter(a => a.employeeId !== empId);
      // Delete payroll items
      db.payroll = db.payroll.filter(p => p.employeeId !== empId);

      JSONDatabase.save(db);
      res.json({ success: true, message: 'Employee and all associated records deleted successfully.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- DEPARTMENT ENDPOINTS ---

  // Get all departments
  app.get('/api/departments', authenticateToken, (req, res) => {
    try {
      const db = JSONDatabase.load();
      // Enriched departments with employee headcount and total salary cost
      const enriched = db.departments.map(dept => {
        const deptEmployees = db.employees.filter(e => e.departmentId === dept.id);
        const manager = db.employees.find(e => e.id === dept.managerId);
        return {
          ...dept,
          headcount: deptEmployees.length,
          totalSalary: deptEmployees.reduce((sum, e) => sum + e.salary, 0),
          managerName: manager ? manager.name : (dept.managerName || 'Unassigned')
        };
      });
      res.json(enriched);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create Department (Admin only)
  app.post('/api/departments', authenticateToken, requireAdmin, (req, res) => {
    try {
      const db = JSONDatabase.load();
      const { name, managerId, budget, location, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Department name is required' });
      }

      const manager = db.employees.find(e => e.id === managerId);

      const newDept: Department = {
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
      res.status(201).json(newDept);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update Department (Admin only)
  app.put('/api/departments/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
      const db = JSONDatabase.load();
      const deptId = req.params.id;
      const index = db.departments.findIndex(d => d.id === deptId);

      if (index === -1) {
        return res.status(404).json({ error: 'Department not found' });
      }

      const { name, managerId, budget, location, description } = req.body;
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
      res.json(db.departments[index]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete Department (Admin only)
  app.delete('/api/departments/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
      const db = JSONDatabase.load();
      const deptId = req.params.id;

      const index = db.departments.findIndex(d => d.id === deptId);
      if (index === -1) {
        return res.status(404).json({ error: 'Department not found' });
      }

      // Safeguard: reassign employees to standard/any remaining department or leave unassigned
      db.departments = db.departments.filter(d => d.id !== deptId);
      const remainingDept = db.departments[0]?.id || '';
      
      db.employees = db.employees.map(emp => {
        if (emp.departmentId === deptId) {
          return { ...emp, departmentId: remainingDept };
        }
        return emp;
      });

      JSONDatabase.save(db);
      res.json({ success: true, message: 'Department deleted successfully. Linked employees were reassigned.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- ATTENDANCE ENDPOINTS ---

  // Get attendance logs (Admin sees all, Employee sees own)
  app.get('/api/attendance', authenticateToken, (req: any, res) => {
    try {
      const db = JSONDatabase.load();
      const isAdmin = req.user.role === 'Admin';
      
      const logs = isAdmin 
        ? db.attendance 
        : db.attendance.filter(a => a.employeeId === req.user.employeeId);

      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Mark Daily Attendance (Admin registers state for anyone, Employee registers checking-in/out for today)
  app.post('/api/attendance/mark', authenticateToken, (req: any, res) => {
    try {
      const db = JSONDatabase.load();
      const isAdmin = req.user.role === 'Admin';
      const currentUserEmpId = req.user.employeeId;

      const { employeeId, date, status, clockIn, clockOut, leaveReason } = req.body;
      const targetEmpId = isAdmin && employeeId ? employeeId : currentUserEmpId;

      if (!targetEmpId) {
        return res.status(400).json({ error: 'Employee ID is required.' });
      }

      const emp = db.employees.find(e => e.id === targetEmpId);
      if (!emp) {
        return res.status(404).json({ error: 'Target employee record not found.' });
      }

      const targetDate = date || new Date().toISOString().split('T')[0];

      // Find if we already have an entry for this employee on this date
      const logIdx = db.attendance.findIndex(a => a.employeeId === targetEmpId && a.date === targetDate);

      const statusMap: 'Present' | 'Absent' | 'Leave' | 'Late' = status || 'Present';

      if (logIdx !== -1) {
        // Update existing clock-in/out attendance log
        db.attendance[logIdx] = {
          ...db.attendance[logIdx],
          status: statusMap,
          clockIn: clockIn !== undefined ? clockIn : db.attendance[logIdx].clockIn,
          clockOut: clockOut !== undefined ? clockOut : db.attendance[logIdx].clockOut,
          leaveReason: leaveReason !== undefined ? leaveReason : db.attendance[logIdx].leaveReason
        };
      } else {
        // Create new daily registration
        const newLog: Attendance = {
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
      }

      JSONDatabase.save(db);
      res.json({ success: true, message: 'Attendance registered successfully.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- PAYROLL ENDPOINTS ---

  // Get payroll logs (Admin queries all, Employee queries their own slips)
  app.get('/api/payroll', authenticateToken, (req: any, res) => {
    try {
      const db = JSONDatabase.load();
      const isAdmin = req.user.role === 'Admin';

      const logs = isAdmin
        ? db.payroll
        : db.payroll.filter(p => p.employeeId === req.user.employeeId);

      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Generate payroll for a month (Admin only)
  app.post('/api/payroll/generate', authenticateToken, requireAdmin, (req, res) => {
    try {
      const db = JSONDatabase.load();
      const { month, year } = req.body;

      if (!month || !year) {
        return res.status(400).json({ error: 'Month and Year parameters are required.' });
      }

      let generatedCount = 0;

      // Loop through all active/on-leave employees and generate their payroll elements if not present already
      db.employees.forEach(emp => {
        const alreadyExists = db.payroll.some(p => p.employeeId === emp.id && p.month === month && p.year === Number(year));
        
        if (!alreadyExists) {
          const monthlyBase = Number((emp.salary / 12).toFixed(2));
          // On Leave employees might get deduction offsets
          const deductions = emp.status === 'On Leave' ? Number((monthlyBase * 0.5).toFixed(2)) : 0;
          const netSalary = monthlyBase - deductions;

          const slip: Payroll = {
            id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            employeeId: emp.id,
            employeeName: emp.name,
            month,
            year: Number(year),
            baseSalary: monthlyBase,
            bonuses: 0,
            deductions,
            netSalary,
            status: 'Pending'
          };
          db.payroll.push(slip);
          generatedCount++;
        }
      });

      JSONDatabase.save(db);
      res.json({ success: true, message: `Successfully generated ${generatedCount} payroll logs for ${month} ${year}.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Pay/Update status of payroll record (Admin only)
  app.put('/api/payroll/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
      const db = JSONDatabase.load();
      const payId = req.params.id;
      const index = db.payroll.findIndex(p => p.id === payId);

      if (index === -1) {
        return res.status(404).json({ error: 'Payroll details not found' });
      }

      const { bonuses, deductions, status } = req.body;
      const current = db.payroll[index];

      const newBonuses = bonuses !== undefined ? Number(bonuses) : current.bonuses;
      const newDeductions = deductions !== undefined ? Number(deductions) : current.deductions;
      const newNetSalary = Number((current.baseSalary + newBonuses - newDeductions).toFixed(2));

      db.payroll[index] = {
        ...current,
        bonuses: newBonuses,
        deductions: newDeductions,
        netSalary: newNetSalary,
        status: status ?? current.status,
        payoutDate: status === 'Paid' ? new Date().toISOString().split('T')[0] : current.payoutDate
      };

      JSONDatabase.save(db);
      res.json(db.payroll[index]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- REPORT/DASHBOARD INSIGHTS ---
  // Returns aggregated analytics metrics
  app.get('/api/reports', authenticateToken, (req, res) => {
    try {
      const db = JSONDatabase.load();

      const totalEmployees = db.employees.length;
      const activeEmployees = db.employees.filter(e => e.status === 'Active').length;
      const leaveEmployees = db.employees.filter(e => e.status === 'On Leave').length;
      const inactiveEmployees = db.employees.filter(e => e.status === 'Inactive').length;

      // Department distribution
      const deptDistribution = db.departments.map(dept => {
        const count = db.employees.filter(e => e.departmentId === dept.id).length;
        const totalSal = db.employees.filter(e => e.departmentId === dept.id).reduce((sum, e) => sum + e.salary, 0);
        return {
          id: dept.id,
          name: dept.name,
          employeeCount: count,
          averageSalary: count > 0 ? Math.round(totalSal / count) : 0,
          budget: dept.budget
        };
      });

      // Attendance Summary for today or generalized
      const todayString = new Date().toISOString().split('T')[0];
      const todayLogs = db.attendance.filter(a => a.date === todayString);
      
      const attendanceSummary = {
        present: todayLogs.filter(a => a.status === 'Present').length,
        absent: todayLogs.filter(a => a.status === 'Absent').length,
        leave: todayLogs.filter(a => a.status === 'Leave').length,
        late: todayLogs.filter(a => a.status === 'Late').length,
        totalTracked: todayLogs.length
      };

      // Total current payroll cost (active payrolls)
      const paidPayrollSum = db.payroll.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.netSalary, 0);
      const pendingPayrollSum = db.payroll.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.netSalary, 0);

      // Average salary
      const averageSalaryGlobal = totalEmployees > 0 
        ? Math.round(db.employees.reduce((sum, e) => sum + e.salary, 0) / totalEmployees) 
        : 0;

      res.json({
        totalEmployees,
        statusSummary: {
          active: activeEmployees,
          leave: leaveEmployees,
          inactive: inactiveEmployees
        },
        deptDistribution,
        attendanceSummary,
        payrollCost: {
          paid: Math.round(paidPayrollSum),
          pending: Math.round(pendingPayrollSum),
          monthlyAverage: Math.round((db.employees.reduce((sum, e) => sum + e.salary, 0)) / 12)
        },
        averageSalaryGlobal
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware setup for Development & Production asset pipelines
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express multi-tier backend listening on http://localhost:${PORT}`);
  });
}

startServer();
