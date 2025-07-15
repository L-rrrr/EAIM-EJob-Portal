import { Navigate, Outlet } from "react-router-dom";

const getUserRole = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
  } catch {
    return null;
  }
};

type ProtectedRouteProps = {
  allowedRoles: string[];
  redirectPath?: string;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, redirectPath = "/login" }) => {
  const role = getUserRole();
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectPath} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;