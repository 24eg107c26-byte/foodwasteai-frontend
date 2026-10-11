import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/dashboard.css";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/dashboard/stats");
      setStats(response.data);
    } catch (err) {
      if (err.response) {
        setError(`Could not load statistics (status ${err.response.status}).`);
      } else {
        setError("Cannot reach the Spring Boot backend. Is it running on port 8080?");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const total = stats ? stats.totalDonations : 0;
  const claimedPercent =
    stats && total > 0 ? Math.round((stats.claimedDonations / total) * 100) : 0;

  return (
    <div className="db-page">
      <div className="db-header">
        <h1>Dashboard</h1>
        <p>Food → AI Prediction → Surplus → Donation → Reduced Waste</p>
        <button className="db-refresh" onClick={loadStats} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div className="db-error">{error}</div>}

      {loading && !stats && <p className="db-muted">Loading statistics...</p>}

      {stats && (
        <>
          <div className="db-grid">
            <div className="db-card db-total">
              <span className="db-label">Total donations</span>
              <span className="db-value">{stats.totalDonations}</span>
            </div>
            <div className="db-card db-available">
              <span className="db-label">Available donations</span>
              <span className="db-value">{stats.availableDonations}</span>
            </div>
            <div className="db-card db-claimed">
              <span className="db-label">Claimed donations</span>
              <span className="db-value">{stats.claimedDonations}</span>
            </div>
            <div className="db-card db-surplus">
              <span className="db-label">AI-predicted surplus</span>
              <span className="db-value">{stats.totalPredictedSurplus}</span>
              <span className="db-sub">
                portions across {stats.totalPredictions} prediction(s)
              </span>
            </div>
          </div>

          <div className="db-panel">
            <h2>Donation progress</h2>
            <p className="db-muted">
              {claimedPercent}% of all donations have been claimed.
            </p>
            <div className="db-bar">
              <div className="db-bar-fill" style={{ width: `${claimedPercent}%` }} />
            </div>
          </div>

          <p className="db-note">
            Predicted surplus adds up every prediction ever made, including test
            runs. It is an AI estimate from a model trained on synthetic data.
          </p>
        </>
      )}
    </div>
  );
}

export default Dashboard;