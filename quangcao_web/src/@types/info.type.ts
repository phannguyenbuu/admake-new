import type { User } from "./user.type";

export interface UserFormProps {
  info: User;
  config: {
    openEdit: boolean;
  };
  toggle: (key: "openEdit") => () => void;
  onRefetch?: () => void;
}

export interface FormValues {
  fullName: string;
  phone: string;
  role: string;
  salary: number;
  username: string;
  password?: string;
  total_salary: string;
}

export interface UpdateData {
  fullName: string;
  phone: string;
  password?: string;
}

export interface UserHeaderProps {
  info: Pick<User, "fullName" | "role" | "avatar">;
  onRefetch?: () => void;
}
