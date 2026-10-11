import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/history.css";
import "../styles/admin.css";

const today = () => new Date().toLocaleDateString("en-CA");

function displayStatus(d) {
  if (d.status === "AVAILABLE" && d.expiryDate < today()) return "EXPIRED";
  return d.status;
}

const formatDate = (value) => (value ? String(value).replace("T", " ").slice(0, 16) : "-");

// A simple list of horizontal bars. items = [{ label, value }]
function BarList({ items, unit, colorClass }) {
  const max = Math.max(0, ...items.map((i) => i.value));
  if (items.length === 0) {
    return <p className="hs-muted">No data yet.</p>;
  }
  return (
    <div>
      {items.map((i) => (
        <div className="rp-row" key={i.label}>
          <span className="rp-label">{i.label}</span>
          <div className="rp-track">
            <div
              className={`rp-fill ${colorClass || ""}`}
              style={{ width: `${max > 0 ? (i.value / max) * 100 : 0}%` }}
            />
          </div>
          <span className="rp-value">
            {i.value}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function AdminPanel() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [u, d, p, r] = await Promise.all([
          api.get("/admin/users"),
          api.get("/admin/donations"),
          api.get("/admin/predictions"),
          api.get("/admin/reports"),
        ]);
        setUsers(u.data);
        setDonations(d.data);
        setPredictions(p.data);
        setReports(r.data);
      } catch (err) {
        if (err.response) {
          setError(`Could not load admin data (status ${err.response.status}).`);
        } else {
          setError("Cannot reach the Spring Boot backend. Is it running on port 8080?");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const tabs = [
    { key: "users", label: `Users (${users.length})` },
    { key: "donations", label: `Donations (${donations.length})` },
    { key: "predictions", label: `Predictions (${predictions.length})` },
    { key: "reports", label: "Reports" },
  ];

  return (
    <div className="hs-page">
      <h1>Admin Panel</h1>
      <p className="hs-sub">Monitor users, donations and AI predictions (read-only).</p>

      {error && <div className="hs-error">{error}</div>}
      {loading && <p className="hs-muted">Loading...</p>}

      {!loading && !error && (
        <>
          <div className="ad-tabs">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={tab === t.key ? "ad-tab ad-tab-active" : "ad-tab"}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "reports" && reports && (
            <div className="rp-grid">
              <div className="rp-card">
                <h2>Donations by status</h2>
                <BarList
                  items={Object.entries(reports.donationsByStatus).map(([label, value]) => ({
                    label,
                    value,
                  }))}
                />
              </div>

              <div className="rp-card">
                <h2>Users by role</h2>
                <BarList
                  colorClass="rp-fill-blue"
                  items={Object.entries(reports.usersByRole).map(([label, value]) => ({
                    label,
                    value,
                  }))}
                />
              </div>

              <div className="rp-card rp-wide">
                <h2>Predicted surplus by food type</h2>
                <BarList
                  colorClass="rp-fill-orange"
                  unit="portions"
                  items={reports.surplusByFoodType.map((s) => ({
                    label: `${s.foodType} (${s.predictions})`,
                    value: s.totalSurplus,
                  }))}
                />
                <p className="rp-note">
                  The number in brackets is how many predictions were made. Values are AI
                  estimates from a model trained on synthetic data.
                </p>
              </div>
            </div>
          )}

          {tab !== "reports" && (
            <div className="hs-table-wrap">
              {tab === "users" && (
                <table className="hs-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Phone</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`ad-role ad-role-${u.role.toLowerCase()}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{u.phone || "-"}</td>
                        <td>{u.location || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tab === "donations" && (
                <table className="hs-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Food</th>
                      <th>Quantity</th>
                      <th>Pickup</th>
                      <th>Expiry</th>
                      <th>Status</th>
                      <th>Donor</th>
                      <th>Recipient</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((d) => {
                      const status = displayStatus(d);
                      return (
                        <tr key={d.id}>
                          <td>{d.id}</td>
                          <td>{d.foodType}</td>
                          <td>{d.quantity} kg</td>
                          <td>{d.pickupLocation}</td>
                          <td>{d.expiryDate}</td>
                          <td>
                            <span className={`hs-badge hs-${status.toLowerCase()}`}>
                              {status}
                            </span>
                          </td>
                          <td>#{d.donorId}</td>
                          <td>{d.recipientId ? `#${d.recipientId}` : "-"}</td>
                          <td>{formatDate(d.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {tab === "predictions" && (
                <table className="hs-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Food record</th>
                      <th>Predicted consumption</th>
                      <th>Predicted surplus</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>#{p.foodRecordId}</td>
                        <td>{Number(p.predictedConsumption).toFixed(1)}</td>
                        <td>{Number(p.predictedSurplus).toFixed(1)}</td>
                        <td>{formatDate(p.predictionDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminPanel;