import { useEffect } from 'react';

export function usePortalTheme(branding) {
  useEffect(() => {
    if (!branding) return;
    document.documentElement.style.setProperty('--portal-primary', branding.primaryColor);
    document.title = `Mon espace SAV · ${branding.displayName}`;
  }, [branding]);
}
