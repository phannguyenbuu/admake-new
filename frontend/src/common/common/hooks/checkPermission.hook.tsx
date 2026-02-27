import { useInfo } from "./info.hook";

export const useCheckPermission = () => {
  const { data: user } = useInfo();
  const adminMode = user?.role.permissions.includes("work:management") || false;
  const adminMaterial =
    user?.role.permissions.includes("warehouse:management") || false;
  const adminInvoice =
    user?.role.permissions.includes("invoice:management") || false;
  const adminRole = user?.role.permissions.includes("role:management") || false;
  const adminCustomer =
    user?.role.permissions.includes("customer:management") || false;
  const adminSetting =
    user?.role.permissions.includes("setting:management") || false;
  const adminUser = user?.role.permissions.includes("user:management") || false;
  const adminAccounting =
    user?.role.permissions.includes("accounting:management") || false;
  const adminStatistics =
    user?.role.permissions.includes("statistics:management") || false;
  return {
    adminMode,
    adminMaterial,
    adminInvoice,
    adminCustomer,
    adminRole,
    adminSetting,
    adminUser,
    adminAccounting,
    adminStatistics,
  };
};
