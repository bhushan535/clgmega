export function getTokenPayload() {
  const t = localStorage.getItem('clg_token');
  if (!t) return null;
  try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; }
}
