import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===============================
  // CSV EXPORT
  // ===============================
  async generateLeaveCSV(filters: any): Promise<string> {
    const leaves = await this.fetchLeaves(filters);

    const headers = [
      'Employee Name',
      'Employee Email',
      'Leave Type',
      'From Date',
      'To Date',
      'Status',
      'Reason',
    ];

    const rows = leaves.map(l => [
      l.user.name,
      l.user.email,
      l.type,
      l.fromDate.toISOString().split('T')[0],
      l.toDate.toISOString().split('T')[0],
      l.status,
      l.reason ?? '',
    ]);

    return this.toCSV([headers, ...rows]);
  }

  // ===============================
  // EXCEL EXPORT
  // ===============================
  async generateLeaveExcel(filters: any): Promise<Buffer> {
    const leaves = await this.fetchLeaves(filters);

    const rows = leaves.map(l => ({
      'Employee Name': l.user.name,
      'Employee Email': l.user.email,
      'Leave Type': l.type,
      'From Date': l.fromDate.toISOString().split('T')[0],
      'To Date': l.toDate.toISOString().split('T')[0],
      Status: l.status,
      Reason: l.reason ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Report');

    return XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    });
  }

  // ===============================
  // SHARED DB FETCH LOGIC
  // ===============================
  private async fetchLeaves(filters: any) {
    const where: any = {};

    if (filters.from && filters.to) {
      where.fromDate = {
        gte: new Date(filters.from),
        lte: new Date(filters.to),
      };
    }

    if (filters.employeeId) {
      where.userId = filters.employeeId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return this.prisma.leave.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ===============================
  // CSV UTILITY
  // ===============================
  private toCSV(data: string[][]): string {
    return data
      .map(row =>
        row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');
  }
}
