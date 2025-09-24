export enum DateRange {
    TODAY = 'today',
    YESTERDAY = 'yesterday',
    THIS_WEEK = 'this_week',
    LAST_WEEK = 'last_week',
    THIS_MONTH = 'this_month',
    LAST_MONTH = 'last_month',
}

export enum DateType {
    DATE = 'date',
    MONTH = 'month',
    YEAR = 'year',
}
type DateRangeObj = {
    start: Date;
    end: Date;
}

export class DateObj extends Date {
    constructor(date: Date) {
        super(date);
    }

    getRange(range: DateRange): DateRangeObj {
        switch (range) {
            case DateRange.TODAY:
                return {
                    start: new Date(this.getFullYear(), this.getMonth(), this.getDate()),
                    end: new Date(this.getFullYear(), this.getMonth(), this.getDate() + 1),
                };
            case DateRange.YESTERDAY:
                return {
                    start: new Date(this.getFullYear(), this.getMonth(), this.getDate() - 1),
                    end: new Date(this.getFullYear(), this.getMonth(), this.getDate()),
                };
            case DateRange.THIS_WEEK:
                return {
                    start: new Date(this.getFullYear(), this.getMonth(), this.getDate() - this.getDay()),
                    end: new Date(this.getFullYear(), this.getMonth(), this.getDate() + (6 - this.getDay())),
                };
            case DateRange.LAST_WEEK:
                return {
                    start: new Date(this.getFullYear(), this.getMonth(), this.getDate() - 7),
                    end: new Date(this.getFullYear(), this.getMonth(), this.getDate()),
                };
            case DateRange.THIS_MONTH:
                return {
                    start: new Date(this.getFullYear(), this.getMonth(), 1),
                    end: new Date(this.getFullYear(), this.getMonth() + 1, 0),
                };
            case DateRange.LAST_MONTH:
                return {
                    start: new Date(this.getFullYear(), this.getMonth() - 1, 1),
                    end: new Date(this.getFullYear(), this.getMonth(), 0),
                };
            default:
                return {
                    start: new Date(this.getFullYear(), this.getMonth(), this.getDate()),
                    end: new Date(this.getFullYear(), this.getMonth(), this.getDate() + 1),
                };
        }
    }
}