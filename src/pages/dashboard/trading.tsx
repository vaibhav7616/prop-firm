import { Navigate } from 'react-router-dom';

/**
 * DashboardTrading - Legacy embedded trading page redirector.
 * The trading terminal is now exclusively hosted on its own dedicated standalone
 * workspace at `/terminal` as per institutional architecture requirements.
 */
export function DashboardTrading() {
  return <Navigate to="/terminal" replace />;
}
