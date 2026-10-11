import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import FoodPrediction from "./pages/FoodPrediction";
import Donations from "./pages/Donations";
import Dashboard from "./pages/Dashboard";
import MyDonations from "./pages/MyDonations";
import AdminPanel from "./pages/AdminPanel";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./styles/auth.css";

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="au-nav">
      <Link to="/">Home</Link>

      {user && <Link to="/dashboard">Dashboard</Link>}
      {user && (user.role === "DONOR" || user.role === "ADMIN") && (
        <Link to="/predict">Food Prediction</Link>
      )}
      {user && <Link to="/donations">Donations</Link>}
      {user && user.role === "DONOR" && <Link to="/my-donations">My Donations</Link>}
      {user && user.role === "RECIPIENT" && <Link to="/my-donations">My Claims</Link>}
      {user && user.role === "ADMIN" && <Link to="/admin">Admin</Link>}

      <span className="au-nav-spacer" />

      {user ? (
        <>
          <span className="au-nav-user">
            {user.name} ({user.role})
          </span>
          <button className="au-logout" onClick={handleLogout}>
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}

function Home() {
  const { user } = useAuth();
  return (
    <div style={{ padding: "20px" }}>
      <h1>FoodWasteAI</h1>
      <p>AI-Powered Food Waste Prediction and Donation Platform</p>
      {user ? (
        <Link to="/dashboard">Go to Dashboard</Link>
      ) : (
        <Link to="/login">Login to get started</Link>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/predict"
            element={
              <ProtectedRoute roles={["DONOR", "ADMIN"]}>
                <FoodPrediction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donations"
            element={
              <ProtectedRoute>
                <Donations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-donations"
            element={
              <ProtectedRoute roles={["DONOR", "RECIPIENT"]}>
                <MyDonations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;