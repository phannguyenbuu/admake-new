import type { BaseEntity } from "./common.type";
import type { Role } from "./role.type";

export type Customer = BaseEntity & {
  user_id: string;
  username: string;
  fullName: string;
  role: Role;
  phone: string;
  workInfo: string;
  workStart: string;
  workEnd: string;
  workAddress: string;
  workPrice: string;
  status: string;
};

export interface CustomerList {
  data: Customer[];
}