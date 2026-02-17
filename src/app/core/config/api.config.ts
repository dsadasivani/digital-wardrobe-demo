import { InjectionToken } from '@angular/core';

declare global {
  interface Window {
    __DW_API_BASE_URL__?: string;
  }
}

export const DEFAULT_API_BASE_URL = 'http://localhost:8080/api/v1';
// export const DEFAULT_API_BASE_URL =
//   'https://digital-wardrobe-backend-beta-1-0-0.onrender.com/api/v1';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_API_BASE_URL;
  }
  const configured = window.__DW_API_BASE_URL__?.trim();
  return configured?.length ? configured : DEFAULT_API_BASE_URL;
}
