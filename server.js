import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';

import { AuthController } from './server/controllers/AuthController.js';
import { EmployeeController } from './server/controllers/EmployeeController.js';
import { DepartmentController } from './server/controllers/DepartmentController.js';
import { AttendanceController } from './server/controllers/AttendanceController.js';
import { PayrollController } from './server/controllers/PayrollController.js';
import { ReportController } from './server/controllers/ReportController.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supreme-employee-workspace-secret-key-2026';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json());

  // CORS Headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Authentication Middlewares
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided, authorization denied' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Failed to authenticate token' });
      }
      req.user = decoded;
      next();
    });
  };

  const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }
    next();
  };

  // --- API ROUTES ---

  // Auth Group
  app.post('/api/auth/signup', AuthController.register);
  app.post('/api/auth/login', AuthController.login);
  app.get('/api/auth/me', authenticateToken, AuthController.getMe);

  // Employee Group
  app.get('/api/employees', authenticateToken, EmployeeController.getEmployees);
  app.post('/api/employees', authenticateToken, requireAdmin, EmployeeController.create);
  app.put('/api/employees/:id', authenticateToken, EmployeeController.update);
  app.delete('/api/employees/:id', authenticateToken, requireAdmin, EmployeeController.delete);

  // Department Group
  app.get('/api/departments', authenticateToken, DepartmentController.getDepartments);
  app.post('/api/departments', authenticateToken, requireAdmin, DepartmentController.create);
  app.put('/api/departments/:id', authenticateToken, requireAdmin, DepartmentController.update);
  app.delete('/api/departments/:id', authenticateToken, requireAdmin, DepartmentController.delete);

  // Attendance Group
  app.get('/api/attendance', authenticateToken, AttendanceController.getLogs);
  app.post('/api/attendance/mark', authenticateToken, AttendanceController.mark);

  // Payroll Group
  app.get('/api/payroll', authenticateToken, PayrollController.getLogs);
  app.post('/api/payroll/generate', authenticateToken, requireAdmin, PayrollController.generate);
  app.put('/api/payroll/:id', authenticateToken, requireAdmin, PayrollController.update);

  // Analytical Reports Group
  app.get('/api/reports', authenticateToken, ReportController.getSummary);

  // --- ASSET SERVING AND VITE PIPELINE ---
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
    console.log(`Express Service-Controller multi-tier JS backend listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
