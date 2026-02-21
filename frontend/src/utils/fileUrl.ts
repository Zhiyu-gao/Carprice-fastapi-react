const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function resolveFileUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.replace(/^\/+/, "");
  return `${API_BASE_URL}/files/${normalized}`;
}
