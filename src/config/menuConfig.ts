// src/config/menuConfig.ts
export interface MenuConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  badge?: string | number;
  requiredPermissions?: string[];
  requiredFeatures?: string[];
  children?: MenuConfig[];
}

export const menuConfig: MenuConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/dashboard',
  },
  // ... rest of menu configuration
];