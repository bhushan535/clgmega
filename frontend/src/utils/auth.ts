export function getUserFromToken() {
  const token = localStorage.getItem("clg_token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}
