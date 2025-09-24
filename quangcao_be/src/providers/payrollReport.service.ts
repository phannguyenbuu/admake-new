// src/payroll/payroll-report.service.ts
import * as ExcelJS from 'exceljs';
import dayjs from 'dayjs';
import { Types } from 'mongoose';

export interface PayrollRow {
  _id?: Types.ObjectId;
  name: string;                 // Họ và tên
  role: string;                 // Chức vụ
  level_salary: number;         // Bậc lương
  standardWorkingDays: number;  // Số ngày công chuẩn
  dayWorking: number;           // Số ngày làm
  overtime: number;             // Số giờ tăng ca
  reward: number;               // Thưởng/khác
  salary: number;               // Lương cứng (theo tháng)
  total_salary: number;         // Thực nhận (nếu = 0 sẽ tự tính)
}

export class PayrollReportService {
  private borderThin = {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    right: { style: 'thin' as const },
  };

  private teal = 'FF06B6B8';          // #06b6b8
  private headerGray = 'FFFDFDFD';
  private textMuted = 'FF6B7280';

  // công thức tính mặc định nếu total_salary = 0
  // Thực nhận ≈ (salary / standardWorkingDays) * dayWorking + reward
  private calcTotal(row: PayrollRow) {
    if (row.total_salary && row.total_salary > 0) return row.total_salary;
    const daily = row.standardWorkingDays > 0 ? row.salary / row.standardWorkingDays : 0;
    return Math.round(daily * row.dayWorking + (row.reward || 0));
  }

  async buildExcel(month: number, year: number, data: PayrollRow[]): Promise<ExcelJS.Workbook> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Bang tinh cong', {
      properties: { defaultRowHeight: 22 },
      views: [{ showGridLines: false }],
    });

    // ── columns
    ws.columns = [
      { header: 'Họ và tên', key: 'name', width: 28 },
      { header: 'Chức vụ', key: 'role', width: 22 },
      { header: 'Bậc lương', key: 'level', width: 12 },
      { header: 'Số ngày công', key: 'stdDays', width: 14 },
      { header: 'Số ngày làm', key: 'workDays', width: 14 },
      { header: 'Số giờ tăng ca', key: 'ot', width: 16 },
      { header: 'Thực nhận', key: 'total', width: 18 },
    ];

    // ── title rows (merge theo ảnh)
    // A1:C1 -> "Tháng mm/yyyy"
    ws.mergeCells('A1:C1');
    const titleLeft = ws.getCell('A1');
    titleLeft.value = `Tháng ${String(month).padStart(2, '0')}/${year}`;
    titleLeft.font = { bold: true, size: 14 };
    titleLeft.alignment = { vertical: 'middle', horizontal: 'center' };

    // D1:F1 -> "TÍNH CÔNG"
    ws.mergeCells('D1:G1');
    const titleCenter = ws.getCell('D1');
    titleCenter.value = 'TÍNH CÔNG';
    titleCenter.font = { bold: true, size: 14 };
    titleCenter.alignment = { vertical: 'middle', horizontal: 'center' };

    // G2:G2 -> "Thực nhận" khối nền teal
    // ws.mergeCells('G2:G2');
    // const rightHeader = ws.getCell('G2');
    // rightHeader.value = 'Thực nhận';
    // rightHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    // rightHeader.alignment = { vertical: 'middle', horizontal: 'center' };
    // rightHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.teal } };
    // rightHeader.border = this.borderThin;

    // ── header row (row 2) cho A..F
    const headerRow = ws.getRow(2);
    headerRow.values = [
      'Họ và tên',
      'Chức vụ',
      'Bậc lương',
      'Số ngày công',
      'Số ngày làm',
      'Số giờ tăng ca',
      'Thực nhận',
    ];
    headerRow.height = 24;

    for (let c = 1; c <= 7; c++) {
      const cell = ws.getCell(2, c);
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.headerGray } };
      cell.border = this.borderThin;
    }

    // ── body
    let r = 3;
    const moneyFmt = '#,##0" đ";-#,##0" đ";"0 đ"';

    for (const row of data) {
      const rowExcel = ws.getRow(r);
      const total = this.calcTotal(row);

      rowExcel.getCell(1).value = row.name;
      rowExcel.getCell(2).value = row.role;
      rowExcel.getCell(3).value = row.level_salary ?? row.level_salary;
      rowExcel.getCell(4).value = row.standardWorkingDays ?? 0;
      rowExcel.getCell(5).value = row.dayWorking ?? 0;
      rowExcel.getCell(6).value = row.overtime ?? 0;
      rowExcel.getCell(7).value = total;

      // style
      for (let c = 1; c <= 7; c++) {
        const cell = rowExcel.getCell(c);
        cell.border = this.borderThin;
        cell.alignment = c === 1 || c === 2 ? { vertical: 'middle', horizontal: 'left' } : { vertical: 'middle', horizontal: 'center' };
      }
      const totalCell = rowExcel.getCell(7);
      totalCell.numFmt = moneyFmt;
      totalCell.border = this.borderThin;
      totalCell.alignment = { vertical: 'middle', horizontal: 'right' };
      totalCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.teal } };

      r++;
    }

    // viền ngoài + nền nhạt cho bảng trái
    for (let row = 3; row < r; row++) {
      for (let col = 1; col <= 6; col++) {
        ws.getCell(row, col).border = this.borderThin;
      }
      // kẻ viền giữa block phải
      ws.getCell(row, 7).border = this.borderThin;
    }

    // page setup
    ws.pageSetup = {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    };

    return wb;
  }
}
