import { useEffect, useState } from "react";
import api from "./../services/api";
import { useAuth } from "../context/AuthContext";

function Donations() {
  const { user } = useAuth();
  const isDonor = user?.role === "DONOR";
  const isRecipient = user?.role === "RECIPIENT";

  const [donations, setDonations] = useState([]);
  const [foodType, setFoodType] = useState("Rice");
  const [quantity, setQuantity] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  const errorText = (error, fallback) =>
    error.response?.data?.message ||
    error.response?.data?.detail ||
    error.response?.data?.error ||
    fallback;

  const fetchDonations = async () => {
    try {
      const response = await api.get("/donations");
      setDonations(response.data);
    } catch (error) {
      setMessage("Unable to load donations. Check the backend.");
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // donorId is not sent: the backend takes it from your login token.
      await api.post("/donations", {
        foodType,
        quantity: Number(quantity),
        pickupLocation,
        expiryDate
      });

      setMessage("Food donation added successfully!");
      setQuantity("");
      setPickupLocation("");
      setExpiryDate("");

      await fetchDonations();
    } catch (error) {
      setMessage(errorText(error, "Failed to add donation. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (id) => {
    setMessage("");

    try {
      // recipientId is not sent: the backend takes it from your login token.
      await api.post(`/donations/${id}/claim`);

      setMessage("Donation claimed successfully!");
      await fetchDonations();
    } catch (error) {
      setMessage(errorText(error, "Unable to claim this donation."));
    }
  };

  return (
    <div style={styles.page}>
      <h1>Food Donations</h1>
      <p>Share surplus food and help reduce food waste.</p>

      {isDonor && (
        <section style={styles.card}>
          <h2>Donate Surplus Food</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <label>Food Type</label>
            <select
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
              style={styles.input}
            >
              <option>Rice</option>
              <option>Chapati</option>
              <option>Dal</option>
              <option>Biryani</option>
              <option>Pasta</option>
              <option>Vegetables</option>
            </select>

            <label>Quantity (kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              style={styles.input}
            />

            <label>Pickup Location</label>
            <input
              type="text"
              required
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="Enter pickup location"
              style={styles.input}
            />

            <label>Expiry Date</label>
            <input
              type="date"
              min={minDate}
              required
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              style={styles.input}
            />

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Submitting..." : "Donate Food"}
            </button>
          </form>
        </section>
      )}

      {message && <p>{message}</p>}

      <section style={styles.list}>
        <h2>Available Donations</h2>

        {donations.length === 0 ? (
          <p>No available donations right now.</p>
        ) : (
          donations.map((donation) => (
            <div key={donation.id} style={styles.card}>
              <h3>{donation.foodType}</h3>
              <p>Quantity: {donation.quantity} kg</p>
              <p>Pickup: {donation.pickupLocation}</p>
              <p>Expiry: {donation.expiryDate}</p>
              <p>Status: {donation.status}</p>

              {isRecipient && (
                <button
                  onClick={() => handleClaim(donation.id)}
                  disabled={donation.status !== "AVAILABLE"}
                  style={styles.button}
                >
                  Claim Donation
                </button>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "700px",
    margin: "30px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif"
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    marginTop: "20px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "15px"
  },
  button: {
    padding: "11px",
    marginTop: "10px",
    backgroundColor: "#218838",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  },
  list: {
    marginTop: "30px"
  }
};

export default Donations;