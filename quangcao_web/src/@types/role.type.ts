import type { BaseEntity } from "./common.type";

export interface Role extends BaseEntity {
  permissions: string[];
  name: string;
}

export interface RoleModalProps {
  open: boolean;
  onCancel: () => void;
  refetchRoles: () => void;
  role?: Role;
}

export interface RoleFormData {
  name: string;
  permissions: Record<string, boolean>;
}

export interface PermissionItem {
  label: string;
  value: string;
}
