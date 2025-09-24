// src/quotation/quotation.service.ts
import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as  dayjs from 'dayjs';
import { QuotationDto, MaterialItem, LaborItem } from './dto/quotation.dto';
import { join } from 'path';

@Injectable()
export class QuotationService {
    // currency for vnd
  private currency = '#,##0;[Red]-#,##0';

  private safeMerge(ws: ExcelJS.Worksheet, range: string) {
    try {
      ws.mergeCells(range);
    } catch (error) {
      // Nếu range đã merge trước đó, bỏ qua
      // console.log('merge skip', range);
    }
  }

  private borderAll() {
    return {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const },
    };
  }

  private fillRowRange(
    ws: ExcelJS.Worksheet,
    rowIndex: number,
    startCol: number,
    endCol: number,
    fill: ExcelJS.Fill,
  ) {
    const row = ws.getRow(rowIndex);
    for (let col = startCol; col <= endCol; col++) {
      row.getCell(col).fill = fill;
    }
  }

  async buildExcel(dto: QuotationDto) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('BAO GIA', {
      properties: { defaultRowHeight: 22 },
      views: [{ showGridLines: false }],
    });

    // Cột A..H (8 cột)
    ws.columns = [
      { key: 'A', width: 18 },
      { key: 'B', width: 30 },
      { key: 'C', width: 18 },
      { key: 'D', width: 18 },
      { key: 'E', width: 12 },
      { key: 'F', width: 24 },
      { key: 'G', width: 18 },
      { key: 'H', width: 18 },
    ];

    // ===== Header công ty + logo =====
    // Logo (sync API – không cần await)
    const logoId = wb.addImage({
      filename: join(process.cwd(), '/assets/logo.png'),
      extension: 'png',
    });
    // Đặt logo vùng A2:A5
    ws.addImage(logoId, 'A2:A5');

    // Tiêu đề lớn
    this.safeMerge(ws, 'A4:H4');
    ws.getCell('A4').value = 'BẢNG BÁO GIÁ';
    ws.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell('A4').font = { bold: true, size: 18 };

    // Thông tin công ty (C2:H3)
    this.safeMerge(ws, 'C2:H3');
    ws.getCell('C2').value =
      `CÔNG TY: ${dto.company.name}\n` +
      (dto.company.address ? `Địa chỉ: ${dto.company.address}\n` : '') +
      (dto.company.phone || dto.company.hotline
        ? `ĐT: ${dto.company.phone ?? ''}   Hotline: ${dto.company.hotline ?? ''}\n`
        : '') +
      (dto.company.taxCode ? `MST: ${dto.company.taxCode}` : '');
    ws.getCell('C2').alignment = { wrapText: true, vertical: 'middle' };
    ws.getCell('C2').font = { size: 11 };

    ws.getRow(2).height = 48;

    // ===== Thông tin chung (theo thứ tự chuẩn, không chồng lấn) =====
    ws.getCell('A6').value = 'Ngày:';
    ws.getCell('B6').value = dto.date ? dayjs(dto.date).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY');

    ws.getCell('A7').value = 'Kính gửi:';
    ws.getCell('B7').value = dto.title ?? 'Quý khách hàng';

    this.safeMerge(ws, 'A8:H8');
    ws.getCell('A8').value =
      'Lời đầu tiên, xin trân trọng cảm ơn Quý khách hàng đã quan tâm. Chúng tôi xin gửi bảng báo giá như sau:';
    ws.getCell('A8').alignment = { wrapText: true };

    // ===== I. VẬT TƯ =====
    // Dòng tiêu đề phần
    this.safeMerge(ws, 'A10:H10');
    ws.getCell('A10').value = 'I. Vật tư';
    ws.getCell('A10').font = { bold: true, size: 14 };
    ws.getCell('A10').alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell('A10').border = this.borderAll();
    this.fillRowRange(ws, 10, 1, 8, {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF97DEDF' },
    });

    

    // Header bảng vật tư (hàng 11)
    const matHeaderRowIdx = 11;
    const matHeader = ['STT', 'TÊN VẬT TƯ', '', 'ĐVT', 'SL', 'ĐƠN GIÁ', 'THÀNH TIỀN', 'GHI CHÚ'];
    const headerRow1 = ws.getRow(matHeaderRowIdx);
    matHeader.forEach((v, i) => (headerRow1.getCell(i + 1).value = v));
    this.safeMerge(ws, `B${matHeaderRowIdx}:C${matHeaderRowIdx}`);
    headerRow1.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = this.borderAll();
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF97DEDF' } };
    });

    // Dữ liệu vật tư bắt đầu từ hàng 12
    let matDataStart = matHeaderRowIdx + 1; // 12
    let curRow = matDataStart;
    dto.materials.forEach((m: MaterialItem, index: number) => {
      const r = ws.getRow(curRow++);
      r.getCell(1).value = index + 1;
      r.getCell(2).value = m.name;
      this.safeMerge(ws, `B${r.number}:C${r.number}`);
      r.getCell(4).value = m.unit;
      r.getCell(5).value = m.qty;
      r.getCell(6).value = m.price;
      r.getCell(6).numFmt = this.currency;
      r.getCell(7).value = { formula: `E${r.number}*F${r.number}` };
      r.getCell(7).numFmt = this.currency;
      r.getCell(8).value = m.note ?? '';

      r.eachCell((cell, col) => {
        cell.border = this.borderAll();
        if ([1, 4, 5, 6, 7].includes(col)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { vertical: 'middle', wrapText: true };
        }
      });
    });

    const matDataEnd = curRow - 1; // hàng cuối của vật tư

    // ===== II. NHÂN CÔNG =====
    const laborTitleRowIdx = matDataEnd + 1; // chừa 1 dòng trống giữa hai phần
    this.safeMerge(ws, `A${laborTitleRowIdx}:H${laborTitleRowIdx}`);
    ws.getCell(`A${laborTitleRowIdx}`).value = 'II. Nhân công';
    ws.getCell(`A${laborTitleRowIdx}`).font = { bold: true, size: 14 };
    ws.getCell(`A${laborTitleRowIdx}`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell(`A${laborTitleRowIdx}`).border = this.borderAll();
    this.fillRowRange(ws, laborTitleRowIdx, 1, 8, {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF97DEDF' },
    });

    // Header nhân công
    const laborHeaderRowIdx = laborTitleRowIdx + 1;
    const laborHeader = [
      'STT',
      'BẬC NHÂN CÔNG',
      'SỐ LƯỢNG',
      'ĐƠN GIÁ NHÂN CÔNG',
      '',
      'SỐ NGÀY THI CÔNG',
      'THÀNH TIỀN',
      'GHI CHÚ',
    ];
    const headerRow2 = ws.getRow(laborHeaderRowIdx);
    laborHeader.forEach((v, i) => (headerRow2.getCell(i + 1).value = v));
    this.safeMerge(ws, `D${laborHeaderRowIdx}:E${laborHeaderRowIdx}`);
    headerRow2.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = this.borderAll();
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF97DEDF' } };
    });

    // Dữ liệu nhân công
    let laborDataStart = laborHeaderRowIdx + 1;
    let lr = laborDataStart;
    dto.labors.forEach((l: LaborItem, index: number) => {
      const r = ws.getRow(lr++);
      r.getCell(1).value = index + 1;
      r.getCell(2).value = l.level;
      r.getCell(3).value = l.qty;
      r.getCell(4).value = l.unitPrice;
      r.getCell(4).numFmt = this.currency;
      this.safeMerge(ws, `D${r.number}:E${r.number}`);
      r.getCell(6).value = l.days;
      r.getCell(7).value = { formula: `C${r.number}*D${r.number}*F${r.number}` };
      r.getCell(7).numFmt = this.currency;
      r.getCell(8).value = l.note ?? '';

      r.eachCell((cell, col) => {
        cell.border = this.borderAll();
        if ([1, 3, 4, 6, 7].includes(col)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { vertical: 'middle', wrapText: true };
        }
      });
    });
    const laborDataEnd = lr - 1;

    // ===== TỔNG CỘNG =====
    const totalRowIdx = laborDataEnd + 1; // ngay sau dòng cuối nhân công
    this.safeMerge(ws, `A${totalRowIdx}:F${totalRowIdx}`);
    ws.getCell(`A${totalRowIdx}`).value = 'TỔNG CỘNG:';
    ws.getCell(`A${totalRowIdx}`).font = { bold: true };
    ws.getCell(`A${totalRowIdx}`).alignment = { horizontal: 'right', vertical: 'middle' };

    // Tổng = SUM thành tiền vật tư + SUM thành tiền nhân công
    // Thành tiền luôn ở cột G (7)
    const matSum =
      dto.materials.length > 0 ? `SUM(G${matDataStart}:G${matDataEnd})` : '0';
    const laborSum =
      dto.labors.length > 0 ? `SUM(G${laborDataStart}:G${laborDataEnd})` : '0';
    ws.getCell(`G${totalRowIdx}`).value = { formula: `${matSum} + ${laborSum}` };
    ws.getCell(`G${totalRowIdx}`).numFmt = this.currency;
    ws.getRow(totalRowIdx).eachCell((cell) => (cell.border = this.borderAll()));

    // ===== GHI CHÚ =====
    const noteTitleRow = totalRowIdx + 2;
    this.safeMerge(ws, `A${noteTitleRow - 1}:A${noteTitleRow}`); // giữ nguyên style như bạn để
    ws.getCell(`B${noteTitleRow - 1}`).value = 'Ghi chú:';
    ws.getCell(`B${noteTitleRow - 1}`).font = { bold: true };

    const defaultNotes = [
      '- Giá trên đã bao gồm phí vận chuyển và lắp đặt trong khu vực Hà Nội',
      '- Giao hàng sau ngày kể từ ngày ký hợp đồng',
      '- Bảng báo giá chỉ áp dụng trong vòng 15 ngày kể từ ngày khách hàng nhận báo giá.',
    ];
    const allNotes = dto.notes?.length ? dto.notes : defaultNotes;
    let noteRow = noteTitleRow;
    allNotes.forEach((n) => {
      ws.getCell(`B${noteRow}`).value = n;
      noteRow++;
    });

    // Chiều cao một số dòng
    ws.getRow(8).height = 36;
    ws.getRow(10).height = 24;

    // Chỉ in/hiển thị vùng A..H khi xuất/print
    const lastRowNumber = ws.lastRow?.number ?? 100;
    ws.pageSetup.fitToWidth = 1;
    ws.pageSetup.fitToHeight = 0;
    ws.pageSetup.printArea = `A1:H${lastRowNumber}`;
    // Trả workbook (tuỳ controller của bạn trả Buffer hay ghi file)
    ws.eachColumnKey((col, index) => {
      if(index > 8 && col.key){
        ws.deleteColumnKey(col.key);
      }
    });
    return wb;
  }
}
