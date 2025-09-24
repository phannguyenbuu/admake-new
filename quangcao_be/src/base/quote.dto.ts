import { IsMongoIdObject } from "@libs/common/validators/isMongoIdObject.val";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsString, Min, ValidateNested } from "class-validator";
import { Types } from "mongoose";

export class QuoteDto {
    @IsArray()
    @ValidateNested({each:true})
    @Type(()=>QuoteMaterialDto)
    materials:QuoteMaterialDto[];

    @IsArray()
    @IsMongoIdObject({each:true})
    @ApiProperty({
        description:"Id nhân viên",
        example:["66b1b1b1b1b1b1b1b1b1b1b1","66b1b1b1b1b1b1b1b1b1b1b2"]
    })
    staff_ids:Types.ObjectId[];

    @IsNumber()
    totalDay:number;

    @IsNumber()
    @ApiProperty({
        description:"Hệ số",
        example:10
    })
    @Min(0)
    coefficient:number;
}

// QuoteDto vật liệu
export class QuoteMaterialDto
{
    @IsMongoIdObject()
    @ApiProperty({
        description:"Id vật liệu",
        example:"66b1b1b1b1b1b1b1b1b1b1b1"
    })
    id:Types.ObjectId;

    @IsNumber()
    @ApiProperty({
        description:"Số lượng vật liệu",
        example:10
    })
    quantity:number;
}

