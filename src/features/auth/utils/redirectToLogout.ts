export const LOGOUT_ROUTE = '/api/logout'

// Full navigation instead of router.push: the route handler clears the auth cookies and
// redirects, and only a hard load drops the client router cache and in-memory session state.
export const redirectToLogout = () => {
  window.location.assign(LOGOUT_ROUTE)
}
