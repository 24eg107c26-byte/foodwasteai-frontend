import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "DONOR",
    phone: "",
    location: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.error || "Registration failed.");
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
        <h1>Register</h1>
        <p className="au-sub">Create your FoodWasteAI account</p>

        <label>
          I am a
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="DONOR">Food Donor (canteen, restaurant, hostel)</option>
            <option value="RECIPIENT">Recipient (NGO, charity)</option>
          </select>
        </label>

        <label>
          Name / Organization
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Password (6 to 72 characters)
          <input
            type="password"
            name="password"
            minLength="6"
            maxLength="72"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Phone
          <input name="phone" value={form.phone} onChange={handleChange} />
        </label>

        <label>
          Location
          <input name="location" value={form.location} onChange={handleChange} />
        </label>

        {error && <div className="au-error">{error}</div>}

        <button type="submit" className="au-button" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="au-switch">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;