import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.error || "Login failed.");
      } else {
        setError("Cannot reach the backend. Is Spring Boot running on port 8080?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="au-page">
      <form className="au-card" onSubmit={handleSubmit}>
        <h1>Login</h1>
        <p className="au-sub">Welcome back to FoodWasteAI</p>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <div className="au-error">{error}</div>}

        <button type="submit" className="au-button" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="au-switch">
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;