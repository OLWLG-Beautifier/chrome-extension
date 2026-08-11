export function isHomePage(pathname = location.pathname) {
  return /\/olwlg\/?$/.test(pathname);
}