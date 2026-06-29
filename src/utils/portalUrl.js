/** Central Climeto portal URL — logout redirect target for satellite apps */
export function getPortalUrl() {
  return (
    import.meta.env.VITE_PORTAL_URL || 'http://localhost:3100'
  ).replace(/\/$/, '');
}

export function redirectToPortal() {
  window.location.href = `${getPortalUrl()}/?signedOut=1`;
}
