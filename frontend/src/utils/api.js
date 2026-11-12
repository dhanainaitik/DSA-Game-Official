/**
 * Centralized Backend API & WebSocket URL Configuration.
 * Uses Vite's build-time VITE_API_URL without hardcoding localhost or deployment domains.
 */

export function normalizeApiBaseUrl(rawUrl) {
  return String(rawUrl ?? '').trim().replace(/\/+$/, '');
}

export function buildApiUrl(baseUrl, path) {
  const cleanBase = normalizeApiBaseUrl(baseUrl);
  if (!path) return cleanBase;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return cleanBase ? `${cleanBase}${normalizedPath}` : normalizedPath;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env?.VITE_API_URL);

if (import.meta.env?.PROD && !API_BASE_URL) {
  console.warn('[API] VITE_API_URL is not configured for this production build.');
}

export function apiUrl(path) {
  return buildApiUrl(API_BASE_URL, path);
}

export const SOCKET_URL = API_BASE_URL || undefined;

