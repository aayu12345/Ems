import { JSONDatabase } from '../db.js';

export class PayrollService {
  static getPayrollLogs(user) {
    const db = JSONDatabase.load();
    const isAdmin = user.role === 'Admin';

    if (isAdmin) {
      return db.payroll;
    } else {
      return db.payroll.filter(p => p.employeeId === user.employeeId);
    }
  }

  static generatePayroll({ month, year }) {
    if (!month || !year) {
      throw new Error('Month and Year parameters are required.');
    }

    const db = JSONDatabase.load();
    let generatedCount = 0;

    db.employees.forEach(emp => {
      const alreadyExists = db.payroll.some(p => p.employeeId === emp.id && p.month === month && p.year === Number(year));
      
      if (!alreadyExists) {
        const monthlyBase = Number((emp.salary / 12).toFixed(2));
        const deductions = emp.status === 'On Leave' ? Number((monthlyBase * 0.5).toFixed(2)) : 0;
        const netSalary = monthlyBase - deductions;

        const slip = {
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
    return { success: true, count: generatedCount, message: `Successfully generated ${generatedCount} payroll logs for ${month} ${year}.` };
  }

  static updatePayrollRecord(payId, { bonuses, deductions, status }) {
    const db = JSONDatabase.load();
    const index = db.payroll.findIndex(p => p.id === payId);

    if (index === -1) {
      throw new Error('Payroll details not found');
    }

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
    return db.payroll[index];
  }
}
