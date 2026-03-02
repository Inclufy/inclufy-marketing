// src/hooks/usePermissions.ts
export function usePermissions() {
  const user = useAuth();
  
  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) ?? false;
  };
  
  const hasFeature = (feature: string) => {
    return user?.features?.[feature] ?? false;
  };
  
  return { hasPermission, hasFeature };
}