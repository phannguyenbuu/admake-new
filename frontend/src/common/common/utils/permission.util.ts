import type {
  DashboardPermissionKey,
  UserCanViewFormProps,
} from "../../@types/user-can-view.type";

export const ACCOUNTING_SUB_PERMISSION_KEYS: DashboardPermissionKey[] = [
  "view_acc_payroll",
  "view_acc_cashflow",
  "view_acc_ar",
  "view_acc_ap",
  "view_acc_docs",
  "view_acc_ledger",
  "view_acc_tax",
  "view_acc_assets",
  "view_acc_records",
  "view_acc_reports",
];

export const DASHBOARD_PERMISSION_KEYS: DashboardPermissionKey[] = [
  "view_workpoint",
  "view_user",
  "view_supplier",
  "view_customer",
  "view_workspace",
  "view_material",
  "view_invoice",
  "view_accountant",
  "view_statistic",
  ...ACCOUNTING_SUB_PERMISSION_KEYS,
];

const DASHBOARD_HOME_ORDER: Array<{
  path: string;
  permission: DashboardPermissionKey;
}> = [
  { path: "/workpoints", permission: "view_workpoint" },
  { path: "/users", permission: "view_user" },
  { path: "/supplier", permission: "view_supplier" },
  { path: "/customers", permission: "view_customer" },
  { path: "/work-tables", permission: "view_workspace" },
  { path: "/statistics", permission: "view_statistic" },
  { path: "/accounting", permission: "view_accountant" },
  { path: "/materials", permission: "view_material" },
  { path: "/invoices", permission: "view_invoice" },
];

export function buildFullDashboardPermission(): UserCanViewFormProps {
  return DASHBOARD_PERMISSION_KEYS.reduce<UserCanViewFormProps>((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});
}

export function normalizeDashboardPermission(
  roleId: number | null | undefined,
  canViewPermission: UserCanViewFormProps | null | undefined,
): UserCanViewFormProps | null {
  if (roleId === -2) {
    return {
      ...buildFullDashboardPermission(),
      ...(canViewPermission ?? {}),
    };
  }

  if (!canViewPermission) {
    return null;
  }

  const normalized = { ...canViewPermission };
  if (
    ACCOUNTING_SUB_PERMISSION_KEYS.some((permission) => normalized[permission])
  ) {
    normalized.view_accountant = true;
  }

  return normalized;
}

export function hasDashboardPermission(
  canViewPermission: UserCanViewFormProps | null | undefined,
  permission?: DashboardPermissionKey,
): boolean {
  if (!permission) return true;
  return Boolean(canViewPermission?.[permission]);
}

export function getFirstAccessibleDashboardPath(
  canViewPermission: UserCanViewFormProps | null | undefined,
): string | null {
  const next = DASHBOARD_HOME_ORDER.find(({ permission }) =>
    hasDashboardPermission(canViewPermission, permission),
  );

  return next?.path ?? null;
}
