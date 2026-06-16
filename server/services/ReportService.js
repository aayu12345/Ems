import { JSONDatabase } from '../db.js';

export class ReportService {
  static getReportsAndAggregates() {
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

    // Total current payroll cost
    const paidPayrollSum = db.payroll.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.netSalary, 0);
    const pendingPayrollSum = db.payroll.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.netSalary, 0);

    // Average global salary
    const averageSalaryGlobal = totalEmployees > 0 
      ? Math.round(db.employees.reduce((sum, e) => sum + e.salary, 0) / totalEmployees) 
      : 0;

    return {
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
    };
  }
}
