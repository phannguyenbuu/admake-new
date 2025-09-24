// src/attendance/attendance-report.service.ts
import * as ExcelJS from 'exceljs';
import * as dayjs from 'dayjs';
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

type AttendanceMap = Record<
  string,
  { result: string; year: number; month: number; day: number; isSunday: boolean }
>;

interface Person {
  _id?: Types.ObjectId;
  name: string;
  attendances: AttendanceMap;
}
@Injectable()
export class AttendanceReportService {
  private border = {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    right: { style: 'thin' as const },
  };

  /**
   * Xuất Excel bảng chấm công theo tháng
   * @param people dữ liệu như mẫu người dùng đưa
   * @param year  ví dụ 2025
   * @param month số tháng (1-12). Ví dụ tháng 8 => 8
   * @returns Buffer (để attach response) hoặc bạn có thể .xlsx.writeFile
   */
  async buildMonthlyAttendanceExcel(
    people: Person[],
    year: number,
    month: number
  ): Promise<ExcelJS.Workbook> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('CHAM CONG', {
      properties: { defaultRowHeight: 22 },
      views: [{ showGridLines: false, state: 'frozen', xSplit: 1, ySplit: 3 }],
    });

    // ===== Layout constants
    const SUNDAY_FILL:ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'f7e6c4' } }; // vàng nhạt
    const HEADER_FILL:ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'e6f7ff' } }; // xanh nhạt
    const TITLE_FILL:ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ffffff' } };
    const RED = { argb: 'fb2c36' }; // đỏ chữ "T"/"K"
    const BLACK = { argb: '000000' }; // đen chữ "T"/"K"
    const BLUE = { argb: '00b8db' }; // xanh chữ "T"/"K"
    const cellsAlignCenter = { vertical: 'middle' as const, horizontal: 'center' as const };

    // ===== Column widths
    ws.getColumn(1).width = 28; // Tên nhân sự
    // các cột ngày
    const daysInMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth();
    console.log(daysInMonth);
    for (let i = 0; i < daysInMonth; i++) ws.getColumn(i + 2).width = 6.5;

    // ===== Row 1: Title merged
    ws.mergeCells(1, 1, 1, 1 + daysInMonth); // A1 : ???
    const titleCell = ws.getCell(1, 1);
    titleCell.value = `Tháng ${String(month).padStart(2, '0')}/${year}`;
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { size: 14, bold: true };
    titleCell.fill = TITLE_FILL;

    // ===== Row 2: Header "Tên nhân sự" + ngày (01..dd)
    ws.mergeCells(2, 1, 3, 1);
    const nameHeader = ws.getCell(2, 1);
    nameHeader.value = 'Tên nhân sự';
    nameHeader.alignment = cellsAlignCenter;
    nameHeader.font = { bold: true };
    nameHeader.fill = HEADER_FILL;
    nameHeader.border = this.border;

    const weekdayLabel = (d: number) => {
      // 1=Mon ... 7=Sun theo dayjs().day() US (0=Sun). Ta đổi về VN: T2..T7, CN
      const date = dayjs(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      const w = date.day(); // 0..6 (0=CN)
      if (w === 0) return 'CN';
      return `T${w + 1}`; // 1..6 => T2..T7
    };

    // Dòng 2: số ngày
    for (let d = 1; d <= daysInMonth; d++) {
      const col = d + 1;
      const c = ws.getCell(2, col);
      c.value = String(d).padStart(2, '0');
      c.alignment = cellsAlignCenter;
      c.font = { bold: true, size: 10 };
      c.border = this.border;
      const isSunday =
        dayjs(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`).day() === 0;
      if (isSunday) c.fill = SUNDAY_FILL;
    }

    // Dòng 3: thứ (T2..CN)
    for (let d = 1; d <= daysInMonth; d++) {
      const col = d + 1;
      const c = ws.getCell(3, col);
      c.value = weekdayLabel(d);
      c.alignment = cellsAlignCenter;
      c.font = { size: 9, color: { argb: 'FF49A6A6' } };
      c.border = this.border;
      const isSunday =
        dayjs(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`).day() === 0;
      if (isSunday) c.fill = SUNDAY_FILL;
    }

    // ===== Body: từng nhân sự
    let rowIdx = 4;
    for (const person of people) {
      // Cột tên
      const nameCell = ws.getCell(rowIdx, 1);
      nameCell.value = person.name;
      nameCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      nameCell.border = this.border;

      // Các cột ngày
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${year}${String(month).padStart(2, '0')}${String(d).padStart(2, '0')}`;
        const col = d + 1;
        const cell = ws.getCell(rowIdx, col);

        // hiển thị "T" cho T1/T2/T3, "K" cho K1/K2/K3
        const att = person.attendances?.[key];
        const code = att?.result ?? '';
        let display = '';
        if (code.startsWith('T')) display = 'T';
        else if (code.startsWith('K')) display = 'K';
        let num = code.replace(/[TK]/g, '');
        switch(num){
            case '1':
                cell.font = { color: BLACK, bold: true };
                break;
            case '2':
                cell.font = { color: BLUE, bold: true };
                break;
            default:
                cell.font = { color: RED, bold: true };
                break;
        }
        cell.value = display || '';
        cell.alignment = cellsAlignCenter;
        cell.border = this.border;

        // Tô Chủ nhật theo lịch (không phụ thuộc data)
        const isSunday =
          dayjs(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`).day() ===
          0;
        if (isSunday) {
            cell.fill = SUNDAY_FILL;
            cell.value = "";
        };
      }

      rowIdx++;
    }

    // ===== Legend (ghi chú) phía dưới
    rowIdx += 1;
    ws.mergeCells(rowIdx, 1, rowIdx, 6);
    

    // Kẻ viền cho vùng bảng chính
    for (let r = 2; r < 4; r++) {
      for (let c = 1; c <= daysInMonth + 1; c++) {
        ws.getCell(r, c).border = this.border;
      }
    }
    for (let r = 4; r < rowIdx; r++) {
      for (let c = 1; c <= daysInMonth + 1; c++) {
        ws.getCell(r, c).border = this.border;
      }
    }

    // Page setup (in/preview)
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
