import type { User } from "./user.type";

export type DashboardPermissionKey =
  | "view_workpoint"
  | "view_user"
  | "view_supplier"
  | "view_customer"
  | "view_workspace"
  | "view_material"
  | "view_invoice"
  | "view_accountant"
  | "view_statistic"
  | "view_acc_payroll"
  | "view_acc_cashflow"
  | "view_acc_ar"
  | "view_acc_ap"
  | "view_acc_docs"
  | "view_acc_ledger"
  | "view_acc_tax"
  | "view_acc_assets"
  | "view_acc_records"
  | "view_acc_reports";

export interface UserCanViewFormProps {
  id?: string;
  user_id?: string;
  password?: string;
  username?: string;
  users?: User[];
  onDelete?: (ucvId: string | null) => Promise<void> | void;
  view_workpoint?: boolean;
  view_user?: boolean;
  view_supplier?: boolean;
  view_customer?: boolean;
  view_workspace?: boolean;
  view_material?: boolean;
  view_invoice?: boolean;
  view_accountant?: boolean;
  view_statistic?: boolean;
  view_acc_payroll?: boolean;
  view_acc_cashflow?: boolean;
  view_acc_ar?: boolean;
  view_acc_ap?: boolean;
  view_acc_docs?: boolean;
  view_acc_ledger?: boolean;
  view_acc_tax?: boolean;
  view_acc_assets?: boolean;
  view_acc_records?: boolean;
  view_acc_reports?: boolean;
  [key: string]: any;
}
