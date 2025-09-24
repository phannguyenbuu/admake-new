import type { BaseEntity } from "./common.type";

export type Customer = BaseEntity & {
  fullName: string;
  phone: string;
  workInfo: string;
  workStart: string;
  workEnd: string;
  workAddress: string;
  workPrice: string;
  status: string;
};
