const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';

/**
 * Resolves a stored file URL (photo/PDF/medical record) returned by the API into
 * one the browser can fetch directly. Backend /storage/* routes require a JWT
 * query param since <img>/<a> tags can't send Authorization headers.
 */
export const resolveStorageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const absolute = url.startsWith('http') ? url : `${backendUrl}${url}`;
  const token = localStorage.getItem('token');
  if (!token) return absolute;
  const separator = absolute.includes('?') ? '&' : '?';
  return `${absolute}${separator}token=${encodeURIComponent(token)}`;
};
