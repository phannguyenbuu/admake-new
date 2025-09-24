import { DateObj } from "../obj/date";

export class DateUtil {
    static getNow() {
        return new DateObj(new Date());
    }

    static diffDays(from: Date, to: Date) {
        return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    }
}