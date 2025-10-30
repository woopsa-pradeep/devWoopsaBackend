export interface RolePermissionAttributes {
  id: number;
  userId: number;
  module: string;
  add: boolean;
  edit: boolean;
  view: boolean;
  path: string | null; // Path can be null, so we use string | null
  status: boolean;
  isActive: boolean;
}