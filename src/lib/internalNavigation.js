export function internalNavigationPath(value, origin) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;

  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (decoded.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(decoded)) return null;

  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || !url.pathname.startsWith("/") || url.pathname.startsWith("//")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
