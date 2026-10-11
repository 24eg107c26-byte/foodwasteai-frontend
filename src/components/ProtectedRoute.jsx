import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Usage: <ProtectedRoute roles={["DONOR"]}><Page /></ProtectedRoute>
// Without "roles", any logged-in user may enter.
function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div style={{ padding: "30px", textAlign: "center" }}>
        <h2>Access denied</h2>
        <p>Your account type ({user.role}) cannot open this page.</p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;