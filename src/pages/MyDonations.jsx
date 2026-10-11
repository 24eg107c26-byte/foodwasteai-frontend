import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/history.css";

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

// The database never changes AVAILABLE to EXPIRED by itself,
// so we show EXPIRED on screen when an AVAILABLE donation is past its date.
function displayStatus(d) {
  if (d.status === "AVAILABLE" && d.expiryDate < today()) return "EXPIRED";
  return d.status;
}

function MyDonations() {
  const { user } = useAuth();
  const isDonor = user.role === "DONOR";

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const url = isDonor
          ? `/donations/donor/${user.id}`
          : `/donations/recipient/${user.id}`;
        const response = await api.get(url);
        setDonations(response.data);
      } catch (err) {
        if (err.response) {
          setError(`Could not load your history (status ${err.response.status}).`);
        } else {
          setError("Cannot reach the Spring Boot backend. Is it running on port 8080?");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isDonor, user.id, reloadCount]);

  const handleComplete = async (id) => {
    setMessage("");
    setBusyId(id);
    try {
      await api.post(`/donations/${id}/complete`);
      setMessage(`Donation #${id} marked as completed.`);
      setReloadCount((n) => n + 1);
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not mark this donation as completed."
      );
    } finally {
      setBusyId(null);
    }
  };

  const count = (status) =>
    donations.filter((d) => displayStatus(d) === status).length;

  return (
    <div className="hs-page">
      <h1>{isDonor ? "My Donations" : "My Claims"}</h1>
      <p className="hs-sub">
        {isDonor
          ? "Everything you have posted and what happened to it."
          : "Donations you have claimed."}
      </p>

      {error && <div className="hs-error">{error}</div>}
      {message && <div className="hs-info">{message}</div>}
      {loading && <p className="hs-muted">Loading...</p>}

      {!loading && !error && (
        <>
          <div className="hs-summary">
            <div className="hs-chip">Total: {donations.length}</div>
            {isDonor && <div className="hs-chip">Available: {count("AVAILABLE")}</div>}
            <div className="hs-chip">Claimed: {count("CLAIMED")}</div>
            <div className="hs-chip">Completed: {count("COMPLETED")}</div>
            {isDonor && <div className="hs-chip">Expired: {count("EXPIRED")}</div>}
          </div>

          {donations.length === 0 ? (
            <p className="hs-muted">
              {isDonor
                ? "You have not posted any donations yet."
                : "You have not claimed any donations yet."}
            </p>
          ) : (
            <div className="hs-table-wrap">
              <table className="hs-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Food</th>
                    <th>Quantity</th>
                    <th>Pickup</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>{isDonor ? "Claimed by" : "Donor"}</th>
                    {isDonor && <th>Action</th>}
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
                        <td>
                          {isDonor
                            ? d.recipientId
                              ? `Recipient #${d.recipientId}`
                              : "-"
                            : `Donor #${d.donorId}`}
                        </td>
                        {isDonor && (
                          <td>
                            {status === "CLAIMED" ? (
                              <button
                                className="hs-action"
                                disabled={busyId === d.id}
                                onClick={() => handleComplete(d.id)}
                              >
                                {busyId === d.id ? "Saving..." : "Mark as completed"}
                              </button>
                            ) : (
                              "-"
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MyDonations;