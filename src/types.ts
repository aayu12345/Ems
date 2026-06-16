export interface UserSession {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Employee';
    employeeId?: string;
  };
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  departmentId: string;
  salary: number;
  status: 'Active' | 'Inactive' | 'On Leave';
  joinDate: string;
  address: string;
  performanceScore: number;
}

export interface Department {
  id: string;
  name: string;
  managerId?: string;
  managerName?: string;
  budget: number;
  location: string;
  description: string;
  headcount?: number;
  totalSalary?: number;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Late';
  clockIn?: string;
  clockOut?: string;
  leaveReason?: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'Paid' | 'Pending';
  payoutDate?: string;
}

export interface ReportSummary {
  totalEmployees: number;
  statusSummary: {
    active: number;
    leave: number;
    inactive: number;
  };
  deptDistribution: {
    id: string;
    name: string;
    employeeCount: number;
    averageSalary: number;
    budget: number;
  }[];
  attendanceSummary: {
    present: number;
    absent: number;
    leave: number;
    late: number;
    totalTracked: number;
  };
  payrollCost: {
    paid: number;
    pending: number;
    monthlyAverage: number;
  };
  averageSalaryGlobal: number;
}
