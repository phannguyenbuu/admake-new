import type { UserPartialStatus } from "../common/enum/user.enum";
import type { BaseEntity } from "./common.type";
import type { Role } from "./role.type";

export type UserRole =
  | "user:management"
  | "setting:management"
  | "customer:management"
  | "work:management"
  | "statistics:management"
  | "permission:management"
  | "role:management"
  | "accounting:management"
  | "warehouse:management";

export type User = BaseEntity & {
  username: string;
  password: string;
  fullName?: string;
  phone?: string;
  status: string;
  type: string;
  hashKey: string;
  role: Role;
  role_id: number;
  avatar?: string;
  level_salary?: number;
  total_salary?: number;
};
export type JwtResponse = {
  access_token: string;
  roles: UserRole[];
  userId: string;
  username: string;
  icon?: string;
};
export type UserPartial = {
  key: number;
  name: string;
  role: string;
  type: string;
  account: { username: string; password: string };
  phone: string;
  status: UserPartialStatus;
};

export interface FormUserProps {
  onCancel: () => void;
  onRefresh?: () => void;
  user?: User;
  buttonText?: string;
}
