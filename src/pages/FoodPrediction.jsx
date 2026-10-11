import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../styles/prediction.css";

// No login exists yet, so we use donor 1 (same as your test record).
// Later this will come from the logged-in user.
const DONOR_ID = 1;

// IMPORTANT: these values must match the categories in your training dataset.
const FOOD_TYPES = ["Rice", "Chapati", "Dal", "Biryani", "Pasta", "Vegetables"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];

// The index is the number sent to the AI model (0 = Monday ... 6 = Sunday)
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const todayString = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
const todayIndex = () => (new Date().getDay() + 6) % 7; // JS: Sunday = 0, so shift

function FoodPrediction() {
  const [form, setForm] = useState({
    foodType: "Rice",
    mealType: "Lunch",
    dayOfWeek: String(todayIndex()),
    numberOfCustomers: "",
    quantityPrepared: "",
    quantityConsumed: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const customers = Number(form.numberOfCustomers);
    const prepared = Number(form.quantityPrepared);
    const dayIndex = Number(form.dayOfWeek);

    if (!Number.isInteger(customers) || customers <= 0) {
      setError("Number of customers must be a whole number greater than 0.");
      return;
    }
    if (!(prepared > 0)) {
      setError("Quantity prepared must be greater than 0.");
      return;
    }
    if (form.quantityConsumed !== "" && Number(form.quantityConsumed) < 0) {
      setError("Quantity consumed cannot be negative.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: save the food record (the backend needs its id for the prediction)
      const recordResponse = await api.post("/food-records", {
        donorId: DONOR_ID,
        foodType: form.foodType,
        quantityPrepared: prepared,
        quantityConsumed:
            form.quantityConsumed === "" ? 0 : Number(form.quantityConsumed),
        numberOfCustomers: customers,
        mealType: form.mealType,
        dayOfWeek: DAYS[dayIndex],
        recordDate: todayString(),
      });

      const foodRecordId = recordResponse.data.id;
      if (!foodRecordId) {
        throw new Error("The backend did not return an id for the food record.");
      }

      // Step 2: ask the AI model for a prediction (snake_case fields)
      const predictionResponse = await api.post("/predictions/predict", {
        foodRecordId: foodRecordId,
        food_type: form.foodType,
        meal_type: form.mealType,
        day_of_week: dayIndex,
        number_of_customers: customers,
        quantity_prepared: prepared,
      });

      setResult(predictionResponse.data);
    } catch (err) {
      if (err.response) {
        const data = err.response.data;
        setError(
          (data && (data.message || data.error)) ||
            `Request failed (status ${err.response.status}).`
        );
      } else if (err.request) {
        setError("Cannot reach the Spring Boot backend. Is it running on port 8080?");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError("");
  };

  // Values for the result display
  const prepared = result ? Number(result.quantity_prepared) : 0;
  const consumption = result ? Number(result.predicted_consumption) : 0;
  const surplus = result ? Number(result.predicted_surplus) : 0;
  const surplusPercent = prepared > 0 ? Math.round((surplus / prepared) * 100) : 0;

  return (
    <div className="fp-page">
      <div className="fp-header">
        <Link to="/" className="fp-back">
          ← Home
        </Link>
        <h1>Food Surplus Prediction</h1>
        <p className="fp-flow">
          Food → AI Prediction → Surplus → Donation → Reduced Waste
        </p>
      </div>

      <div className="fp-layout">
        {/* ---------- FORM ---------- */}
        <form className="fp-card" onSubmit={handleSubmit}>
          <h2>Enter food details</h2>

          <label>
            Food type
            <select name="foodType" value={form.foodType} onChange={handleChange}>
              {FOOD_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>

          <label>
            Meal type
            <select name="mealType" value={form.mealType} onChange={handleChange}>
              {MEAL_TYPES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label>
            Day of week
            <select name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange}>
              {DAYS.map((d, index) => (
                <option key={d} value={index}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label>
            Expected number of customers
            <input
              type="number"
              name="numberOfCustomers"
              min="1"
              step="1"
              placeholder="e.g. 150"
              value={form.numberOfCustomers}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Quantity prepared (portions)
            <input
              type="number"
              name="quantityPrepared"
              min="1"
              step="any"
              placeholder="e.g. 180"
              value={form.quantityPrepared}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Quantity consumed (optional)
            <input
              type="number"
              name="quantityConsumed"
              min="0"
              step="any"
              placeholder="Leave blank if not known yet"
              value={form.quantityConsumed}
              onChange={handleChange}
            />
          </label>

          {error && <div className="fp-error">{error}</div>}

          <button type="submit" className="fp-button" disabled={loading}>
            {loading ? "Predicting..." : "Predict Surplus"}
          </button>
        </form>

        {/* ---------- RESULT ---------- */}
        <div className="fp-card">
          <h2>Prediction result</h2>

          {loading && <p className="fp-muted">Asking the AI model...</p>}

          {!loading && !result && (
            <p className="fp-muted">
              Fill in the form and click <strong>Predict Surplus</strong>. The
              result will appear here.
            </p>
          )}

          {result && !loading && (
            <>
              <div className="fp-stats">
                <div className="fp-stat fp-stat-consumed">
                  <span className="fp-stat-label">Predicted consumption</span>
                  <span className="fp-stat-value">{consumption.toFixed(1)}</span>
                  <span className="fp-stat-unit">{result.unit}</span>
                </div>
                <div className="fp-stat fp-stat-surplus">
                  <span className="fp-stat-label">Predicted surplus</span>
                  <span className="fp-stat-value">{surplus.toFixed(1)}</span>
                  <span className="fp-stat-unit">{result.unit}</span>
                </div>
              </div>

              <p className="fp-bar-label">
                Of {prepared} {result.unit} prepared, about {surplusPercent}% may
                be left over.
              </p>
              <div className="fp-bar">
                <div
                  className="fp-bar-consumed"
                  style={{ width: `${100 - surplusPercent}%` }}
                />
                <div
                  className="fp-bar-surplus"
                  style={{ width: `${surplusPercent}%` }}
                />
              </div>
              <div className="fp-legend">
                <span>
                  <i className="fp-dot fp-dot-consumed" /> Consumed
                </span>
                <span>
                  <i className="fp-dot fp-dot-surplus" /> Surplus
                </span>
              </div>

              <p className="fp-saved">
                ✔ Saved to database (prediction ID {result.id}, food record ID{" "}
                {result.foodRecordId})
              </p>

              <p className="fp-note">
                This is an estimate from a model trained on synthetic data, not a
                guarantee.
              </p>

              <button type="button" className="fp-button-secondary" onClick={handleReset}>
                Clear result
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default FoodPrediction;