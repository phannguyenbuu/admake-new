import { ApiController, ApiNote } from '@libs/common/decorators/api.decorator';
import { ApiException } from '@libs/common/exception/api.exception';
import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { QuoteDto } from 'src/base/quote.dto';
import { Material } from 'src/material/material.entity';
import { MaterialService } from 'src/material/material.service';
import { SettingService } from 'src/setting/setting.service';
import { User } from 'src/user/user.entity';
import { UserStatus } from 'src/user/user.enum';
import { UserService } from 'src/user/user.service';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';
// remove unused faker imports
import { Row } from 'exceljs';
import { CmdUtil } from '@libs/common/utils/cmd.util';
import { QuotationService } from 'src/providers/quotation.service';
import * as dayjs from 'dayjs';
import { SettingKey } from 'src/setting/setting.enum';
import { ObjectId, Types } from 'mongoose';



interface MaterialItem {
  name: string;
  unit: string;
  quantity: number;
  price: number;
  note?: string;
}

interface LaborItem {
  level: string;
  quantity: number;
  unitPrice: number;
  days: number;
  note?: string;
}

interface ReportData {
  customer: {
    name: string;
    phone: string;
    email: string;
    date: string;
  };
  projectTitle: string;
  materials: MaterialItem[];
  labor: LaborItem[];
}



@ApiController('app')
export class AppController {

  constructor(
    private readonly settingService: SettingService,
    private readonly userService: UserService,
    private readonly materialService: MaterialService,
    private readonly quotationService: QuotationService
  ) { }


  @Post('quote')
  @ApiNote("Báo giá")
  public async quote(@Body() body: QuoteDto, @Res() res: Response) {
    const salaryLevel = await this.settingService.getSettingType<{ id: Types.ObjectId; salary: number; index: number; }[]>(SettingKey.SALARY_LEVEL);
    const standardWorkingDays = await this.settingService.getStandardWorkingDays(dayjs().year(), dayjs().month() + 1);
    // insert data to rows
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=baogia.xlsx');
    const materialsRaw = await this.materialService.findAll({
      _id: { $in: body.materials.map(m => m.id) }
    });
    const laborsRaw = await this.userService.findAllAndRole({
      _id: { $in: body.staff_ids.map(id=>new Types.ObjectId(id)) }
    });
    console.log({ $in: body.staff_ids.map(id=>new Types.ObjectId(id)) });
    const materials = materialsRaw.map(m => ({
      "name": m.name,
      "unit": m.unit,
      "qty": body.materials.find(mm => mm.id.toString() === m._id.toString())?.quantity ?? 0,
      "price": m.price + (m.price * body.coefficient / 100),
      "note": ""
    }));
    const labors = laborsRaw.map(l => ({
      "level":l.role.name,
      "qty": 1,
      "unitPrice": Math.round(((salaryLevel?.find(sl => sl.index.toString() === l.level_salary.toString())?.salary ?? 0) / standardWorkingDays)),
      "days": body.totalDay,
      "note": ""
    }));
    const workbook = await this.quotationService.buildExcel({
      "title": "Quý khách hàng",
      "company": {
        "name": "CÔNG TY CỔ PHẦN THIẾT KẾ - THI CÔNG QUẢNG CÁO ...",
        "address": "45 đăngh thái thân - p. Buôn ma thuột . T daklak",
        "phone": "19000047",
        "hotline": "19000047",
        "taxCode": ""
      },
      "date": dayjs().format('DD/MM/YYYY'),
      "materials": materials,
      "labors": labors,
      "notes": [
        "- Giá đã gồm vận chuyển và lắp đặt nội thành",
        "- Thời gian giao hàng: 3–5 ngày sau ký hợp đồng",
        "- Báo giá có hiệu lực 15 ngày"
      ]
    }
    );
    await workbook.xlsx.write(res);
  }

} 